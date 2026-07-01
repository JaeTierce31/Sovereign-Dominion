# The Constitution — the Dignity charter

This is what makes "Dignity" more than a name: the rights and red-lines of the platform
encoded as **machine-checkable invariants** the kernel enforces on every action, rather
than policy prose that lives in a binder and is honored by convention.

## Model

An **invariant** is a rule the kernel checks inside its gate (`Intent → Gate → …`). Each
has a predicate for *when it applies* and a predicate for *what must hold*, plus what to
do on violation:

- `block` — the Intent is refused before it executes.
- `rollback` — a post-condition drifted; the self-healing runtime rewinds to the last
  verified-safe state (the same mechanism as the demo's self-healing panel).

Invariants compose: a base charter applies platform-wide; each domain registers
additional invariants at boot (`CapabilityRegistration.invariants`).

## Files

- `charter.example.yaml` — a **sketch** of the base charter for the HMIS domain. It is
  illustrative, not legally reviewed. The real charter must be authored with Continuum of
  Care and legal sign-off (HUD, VAWA, 42 CFR Part 2, state rules).

## Ground rules encoded here

1. Consent is scoped and expires; nothing flows past its scope or date.
2. DV victim-service data is **segregated** from the shared store (VAWA) — not merely masked.
3. Eligibility determinations require a **human**; no AI confidence score substitutes.
4. Substance-use records (42 CFR Part 2) get stricter sharing rules.
5. Minors require guardian consent for sharing.
6. Data has a retention limit and a right-to-be-forgotten path.
7. The audit log is append-only; deletions are recorded, never silent.
8. Every share is purpose-limited to a declared, logged purpose.

> These are a starting point for review, not a compliance guarantee. Treat the YAML as a
> design artifact that a CoC + counsel turn into the binding charter.
