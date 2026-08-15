# Phi-Calculus App

> **Internal experimental research tool.** This README describes the repository's intended mathematical and visualization scope; mathematical validity and performance claims require reproducible evidence in the source or accompanying documentation.

An interactive application for exploring phi-related sequences, curvature/geometry experiments, and modal-frequency visualizations within the project's research framework. Built as a visual computation tool with the DemiJoule agent persona used for mathematical-development workflows.

## What is Phi-Calculus?

In this repository, **phi-calculus** is a project-defined mathematical/research vocabulary covering:

- phi-related sequence experiments;
- higher-order recurrence structures, including the project's hendecabonacci experiments;
- curvature and manifold visualizations;
- modal-frequency analysis of modeled state spaces.

These are project-defined constructs unless a specific mathematical result is independently derived and cited. The use of terms such as *curvature*, *harmonic*, or *phi-weighted* does not by itself establish equivalence to a standard mathematical theory.

## Application Structure

```text
phi-calculus-app/
└── phi-app/
    ├── index.html
    ├── vercel.json
    ├── api/
    ├── assets/
    ├── docs/
    ├── evaluator/
    └── viz/
```

## Deployment

Configured for Vercel deployment via `phi-app/vercel.json`.

To run locally:

```bash
cd phi-app
npx serve .
```

## Mathematical Boundary

### Hendecabonacci sequence

The repository experiments with the 11th-order recurrence:

```text
H(n) = H(n-1) + H(n-2) + ... + H(n-11)
```

The recurrence itself is a defined mathematical construction. Any claim that it is a validated oscillation kernel, optimal architecture, or physically meaningful model requires separate evidence.

### Phi-weighted geometry

Phi-weighted geometric calculations and visualizations are experimental constructs in this repository. They should not be represented as established Riemannian optimization results without a derivation and validation appropriate to the specific claim.

## Ecosystem Context

Related repositories may integrate with or reference this work, but repository relationships do not establish mathematical equivalence or validation.

| Repository | Relationship |
|---|---|
| `3d-visualization-hub` | Visualization companion |
| `DGAF-Framework` | Separate governance/evaluation track |
| `Driftwatch` | Separate drift-detection track |
| `Amethyst-Governance-Eval-Stack` | Separate evaluation track |

## IP / Distribution

This repository may contain project-specific intellectual property. Consult the repository license and applicable notices for the authoritative distribution terms. The README does not itself create legal restrictions beyond those terms.

## Status

**Active — internal experimental research.**

Current mathematical, performance, and deployment claims should be established from the implementation, tests, derivations, and dated evidence rather than from agent-role descriptions or historical README language.

**Maintained by:** `ndrorchestration`
**Deployment:** Vercel
