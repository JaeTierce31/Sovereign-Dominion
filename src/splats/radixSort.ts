export function radixSortFloat32(keys: Float32Array, values: Uint32Array): void {
  const n = keys.length;
  const tempKeys = new Float32Array(n);
  const tempVals = new Uint32Array(n);
  const count = new Uint32Array(256);

  for (let pass = 0; pass < 4; pass++) {
    count.fill(0);
    const shift = pass * 8;

    for (let i = 0; i < n; i++) {
      const bits = new Uint32Array(keys.buffer)[i];
      const byte = (bits >>> shift) & 0xff;
      count[byte]++;
    }

    let total = 0;
    for (let i = 0; i < 256; i++) {
      const c = count[i];
      count[i] = total;
      total += c;
    }

    for (let i = 0; i < n; i++) {
      const bits = new Uint32Array(keys.buffer)[i];
      const byte = (bits >>> shift) & 0xff;
      const dest = count[byte]++;
      tempKeys[dest] = keys[i];
      tempVals[dest] = values[i];
    }

    keys.set(tempKeys);
    values.set(tempVals);
  }
}
