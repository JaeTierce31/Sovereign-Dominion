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
  verified-safe state (the same mechanism as the demo's self-healing panel, generalized
  in `kernel/src/self-healing.js`).

Invariants compose: a base charter applies platform-wide; each domain registers
additional invariants at boot (`CapabilityRegistration.invariants`).

## Files

- `charter.example.yaml` — an early **sketch** written before `Sovereign-Dignity` could
  be reviewed. It assumed a homeless-services eligibility domain (consent/ROI, VAWA DV
  segregation, 42 CFR Part 2). That assumption was wrong — see
  `docs/UNIFICATION.md`'s status note — but the file is kept as-is: it's still a valid
  illustration of the DSL, just for a domain this platform doesn't actually implement.
- `charter.housing-inspection.example.yaml` — the **current** sketch, for the domain
  `Sovereign-Dignity` actually is: HUD NSPIRE physical housing inspection. Same DSL,
  invariants scoped to evidence integrity, chain of custody, inspector credentialing,
  and dual attestation instead of consent/eligibility.

Both are illustrative, not legally reviewed. The real charter must be authored with
counsel and HUD guidance sign-off.

## Ground rules encoded in the current (housing-inspection) charter

1. Evidence hashes are immutable once captured; nothing recomputes or overwrites one.
2. Evidence chains are tamper-evident (chain-of-custody link to the prior entry).
3. Only a HUD NSPIRE-certified, currently-active inspector may submit or attest findings.
4. No Seal issues without **dual human attestation** — AI severity classification is
   advisory only and never substitutes for it.
5. Recorded deficiency severity may not be downgraded below what the evidence supports.
6. Records are retained for the HUD-mandated window; deletion before that window closes
   is refused, not merely logged.
7. The audit log is append-only; deletions are recorded, never silent.

> These are a starting point for review, not a compliance guarantee. Treat the YAML as a
> design artifact that HUD guidance + counsel turn into the binding charter.
