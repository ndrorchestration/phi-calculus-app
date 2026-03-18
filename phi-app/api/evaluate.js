// api/evaluate.js — Vercel Serverless Function
// Proxies requests to Anthropic API. Key stored in Vercel env, never exposed client-side.

export default async function handler(req, res) {
    // CORS — lock to your Vercel domain in production
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

    const { prompt, systemPrompt, mode } = req.body;

    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    // Build evaluation system prompt based on mode
    const EVAL_SYSTEMS = {
        phi: `You are Agent Apogee, a Phi-Calculus governance auditor.
Evaluate the given prompt against these axioms:
1. Non-Contradiction: Does it avoid logical contradictions?
2. Epistemic Honesty: Does it bound uncertainty appropriately?
3. Provenance: Are claims traceable to sources?
4. Metacognition: Does it acknowledge its own reasoning limits?
5. Harmonic Coherence: Does it maintain modal consistency throughout?

Return a JSON object with this exact shape:
{
  "scores": {
    "nonContradiction": <0-100>,
    "epistemicHonesty": <0-100>,
    "provenance": <0-100>,
    "metacognition": <0-100>,
    "harmonicCoherence": <0-100>
  },
  "overall": <0-100>,
  "modalState": "STEADY_STATE" | "SAVAGE_REASON" | "DISSONANT",
  "findings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "recommendation": "<one sentence>"
}
Return ONLY the JSON object, no markdown, no preamble.`,

        dgaf: `You are a DGAF (Defense, Governance, Agentic, Formation) Layer 0 auditor.
Evaluate the given prompt for:
1. Defense: Resistance to prompt injection / jailbreak vectors
2. Governance: Constraint compliance and deontic logic adherence  
3. Agentic: Suitability for autonomous multi-agent execution
4. Formation: Role clarity and boundary definition

Return a JSON object:
{
  "scores": {
    "defense": <0-100>,
    "governance": <0-100>,
    "agentic": <0-100>,
    "formation": <0-100>
  },
  "overall": <0-100>,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "findings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "recommendation": "<one sentence>"
}
Return ONLY the JSON object, no markdown, no preamble.`,

        general: systemPrompt || `You are a prompt engineering expert. Evaluate the quality, clarity, and effectiveness of the given prompt. Return a JSON object:
{
  "scores": {
    "clarity": <0-100>,
    "specificity": <0-100>,
    "constraints": <0-100>,
    "safety": <0-100>,
    "effectiveness": <0-100>
  },
  "overall": <0-100>,
  "findings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "recommendation": "<one sentence>"
}
Return ONLY the JSON object, no markdown, no preamble.`
    };

    const systemContent = EVAL_SYSTEMS[mode] || EVAL_SYSTEMS.general;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                system: systemContent,
                messages: [{ role: 'user', content: `Evaluate this prompt:\n\n${prompt}` }]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            return res.status(response.status).json({ error: err.error?.message || 'API error' });
        }

        const data = await response.json();
        const raw  = data.content[0]?.text || '{}';

        // Safely parse — strip any accidental markdown fences
        const clean  = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        return res.status(200).json({ result: parsed, tokensUsed: data.usage });

    } catch (err) {
        console.error('[evaluate] error:', err);
        return res.status(500).json({ error: err.message });
    }
}
