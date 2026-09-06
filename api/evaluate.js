const MAX_PROMPT_CHARS = 12000;
const MAX_SYSTEM_PROMPT_CHARS = 6000;
const MODES = new Set(['phi', 'dgaf', 'general']);
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

function clampNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function validateResult(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Evaluator returned a non-object result.');
  if (!value.scores || typeof value.scores !== 'object' || Array.isArray(value.scores)) throw new Error('Evaluator result is missing scores.');

  const scores = {};
  for (const [key, raw] of Object.entries(value.scores)) {
    if (!/^[A-Za-z][A-Za-z0-9]{0,63}$/.test(key)) continue;
    const score = clampNumber(raw);
    if (score !== null) scores[key] = score;
  }
  if (!Object.keys(scores).length) throw new Error('Evaluator result contains no valid scores.');

  const overall = clampNumber(value.overall);
  if (overall === null) throw new Error('Evaluator result is missing a valid overall score.');

  const findings = Array.isArray(value.findings)
    ? value.findings.filter((item) => typeof item === 'string').slice(0, 8).map((item) => item.slice(0, 1200))
    : [];
  const recommendation = typeof value.recommendation === 'string' ? value.recommendation.slice(0, 1600) : '';
  const modalState = typeof value.modalState === 'string' ? value.modalState.slice(0, 80) : undefined;
  const riskLevel = typeof value.riskLevel === 'string' ? value.riskLevel.slice(0, 80) : undefined;

  return { scores, overall, findings, recommendation, modalState, riskLevel };
}

function systems(customSystemPrompt) {
  return {
    phi: `You are a prompt-analysis assistant operating inside the Phi-Calculus experimental research UI. Score only the prompt-writing properties described below. These scores are model-generated heuristics, not mathematical validation, governance certification, or empirical measurements.
Evaluate: logical consistency, epistemic honesty, provenance readiness, metacognitive boundary awareness, and internal/coherence consistency.
Return JSON only with scores (0-100 integers), overall (0-100), modalState as one of STEADY_STATE | SAVAGE_REASON | DISSONANT, up to 8 findings, and one recommendation. "Harmonic" or modal labels are project vocabulary only.`,
    dgaf: `You are a prompt-analysis assistant using a project-local rubric related to DGAF (Dynamic Governance Agentic Formation). These scores are model-generated heuristics, not certification, authorization, security proof, or evidence that DGAF itself is effective.
Evaluate: constraint clarity, governance-boundary clarity, agent-role clarity, failure behavior, and provenance/evidence readiness.
Return JSON only with scores (0-100 integers), overall (0-100), riskLevel as one of LOW | MEDIUM | HIGH | CRITICAL, up to 8 findings, and one recommendation.`,
    general: customSystemPrompt || `You are a prompt-engineering reviewer. Evaluate clarity, specificity, constraints, safety-boundary clarity, and likely instruction effectiveness. Scores are model-generated heuristics, not validated performance measurements. Return JSON only with scores (0-100 integers), overall (0-100), up to 8 findings, and one recommendation.`
  };
}

function sameOriginAllowed(req) {
  const configured = process.env.EVALUATOR_ALLOWED_ORIGIN;
  const origin = req.headers.origin;
  if (!origin) return null;
  if (configured) return origin === configured ? configured : false;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return origin === `${proto}://${host}` ? origin : false;
}

export default async function handler(req, res) {
  const allowedOrigin = sameOriginAllowed(req);
  if (allowedOrigin === false) return res.status(403).json({ error: 'Origin not allowed.' });
  if (allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Evaluator provider is not configured.' });

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  const mode = typeof req.body?.mode === 'string' ? req.body.mode.toLowerCase() : 'general';
  const systemPrompt = typeof req.body?.systemPrompt === 'string' ? req.body.systemPrompt.trim() : '';

  if (!prompt || prompt.length > MAX_PROMPT_CHARS) return res.status(400).json({ error: `prompt must contain 1-${MAX_PROMPT_CHARS} characters.` });
  if (!MODES.has(mode)) return res.status(400).json({ error: 'Unsupported evaluation mode.' });
  if (systemPrompt.length > MAX_SYSTEM_PROMPT_CHARS) return res.status(400).json({ error: `systemPrompt exceeds ${MAX_SYSTEM_PROMPT_CHARS} characters.` });
  if (mode !== 'general' && systemPrompt) return res.status(400).json({ error: 'Custom systemPrompt is allowed only in general mode.' });

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const selectedSystem = systems(systemPrompt)[mode];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        temperature: 0,
        system: selectedSystem,
        messages: [{ role: 'user', content: `Evaluate this prompt:\n\n${prompt}` }]
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 300);
      console.error('[evaluate] provider error', response.status, detail);
      return res.status(502).json({ error: 'Evaluator provider request failed.' });
    }

    const data = await response.json();
    const raw = Array.isArray(data?.content)
      ? data.content.filter((item) => item?.type === 'text' && typeof item.text === 'string').map((item) => item.text).join('\n')
      : '';
    const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const result = validateResult(JSON.parse(clean));

    return res.status(200).json({
      evidenceClass: 'MODEL_HEURISTIC',
      calibrated: false,
      certification: false,
      mode,
      model,
      result,
      usage: data.usage || null
    });
  } catch (error) {
    console.error('[evaluate] failed closed', error);
    return res.status(502).json({ error: 'Evaluator execution failed closed.' });
  }
}
