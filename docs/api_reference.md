# API Reference

## Supplier API (via Cloudflare Worker)

### GET /supplier/?zip={zip}&query={query}

Returns live material pricing for a given ZIP code and search query.

**Parameters:**
- `zip` — US ZIP code (default: 53703)
- `query` — Material search term (default: "retaining wall block")

**Response:**
```json
{
  "data": {
    "materials": {
      "items": [
        {
          "description": "Allan Block Retaining Wall Block",
          "unit": "each",
          "unitPrice": 4.98,
          "supplierName": "Home Depot",
          "supplierDistance": 2.3,
          "stock": 240
        }
      ]
    }
  }
}
```

---

## Weather API (via Cloudflare Worker)

### GET /weather/?lat={lat}&lng={lng}

Returns 14-day construction-grade weather forecast.

**Parameters:**
- `lat` — Latitude (decimal degrees)
- `lng` — Longitude (decimal degrees)

**Response:**
```json
{
  "days": [
    {
      "datetime": "2026-05-15",
      "tempmax": 72,
      "tempmin": 55,
      "precip": 0.0,
      "windspeed": 8,
      "conditions": "Clear",
      "isBuildable": true
    }
  ]
}
```

---

## Material Calculator

### `calcBlockCount(lengthFt, heightFt, blockWIn?, blockHIn?)`

Returns exact block count for a straight wall.

### `monteCarloWalledBlocks(lengthFt, heightFt, blockWIn?, blockHIn?, curveFactor?, samples?)`

Returns statistically adjusted block count with 5% waste factor for curved walls.

### `mulchVolumeFromPolygon(polygon, depthInches)`

Returns `{ area, bags, cubicYards }` using Shoelace formula with 10% compaction.

---

## Compliance Checker

### `checkWallCompliance(element, rules)`

Evaluates a retaining wall against loaded rule packs. Returns `Violation[]`.

### `runAllCompliance(element, rules)`

Dispatches to the correct checker based on `element.type`.

---

## QSSM Trust

### `initQSSM()`

Initializes the WASM lattice-based ZKP prover.

### `proveMaterialList(materials)`

Returns a `Uint8Array` proof that all quantities are positive.

### `verifyProof(proof, materials)`

Returns `true` if the proof validates the material list.
