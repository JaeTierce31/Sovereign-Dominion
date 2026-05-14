# Compliance Engine

## Supported Code Sets

| Code | Version | Coverage |
|------|---------|----------|
| IRC | 2021 | Residential construction |
| IBC | 2021 | Commercial/mixed-use |
| OSHA | 29 CFR 1926 | Construction safety |
| NEC | 2023 | Electrical installations |
| LOCAL | Configurable | Municipal amendments |

## Rule Pack Format

Each rule pack is a JSON array of Rule objects:

```json
[
  {
    "id": "IRC-R404-1",
    "category": "retaining_wall",
    "predicate": {
      "height_ft": { "max": 4 }
    },
    "message": "Retaining walls over 4 ft require engineering stamp",
    "severity": "critical"
  }
]
```

## Severity Levels

| Severity | AR Color | Action Required |
|----------|----------|-----------------|
| critical | RED pulse | Must fix before permit |
| major | RED static | Should fix before construction |
| minor | AMBER | Advisory, document exception |

## Compliance Checking Algorithm

1. Load applicable rule packs for jurisdiction
2. Harmonize with local amendments
3. For each scene element, evaluate all applicable predicates
4. Generate violation list sorted by severity
5. Update GPU violation mask for AR overlay
6. Speak highest-priority violation via Esther

## AR Violation Rendering

Violations are rendered as a pulsing red overlay on affected splats:
- Critical: rapid pulse (4 Hz), full red tint
- Major: slow pulse (1 Hz), partial red tint
- Minor: amber tint, no pulse

## Inspector Mode

Activating inspector mode:
1. Esther: "Start inspection walkthrough"
2. App renders all elements with compliance overlay
3. Camera pans systematically through site
4. Report generated with timestamped photos
5. PDF/A export with QSSM proof for liability protection
