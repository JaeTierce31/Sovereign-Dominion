/// <reference types="@webgpu/types" />

declare module 'webgpu-radix-sort' {
  export class RadixSortKernel {
    constructor(options: {
      device: GPUDevice;
      keys: GPUBuffer;
      values?: GPUBuffer;
      count: number;
      bit_count?: number;
      workgroup_size?: { x: number; y: number };
      check_order?: boolean;
      local_shuffle?: boolean;
      avoid_bank_conflicts?: boolean;
    });
    sort(encoder: GPUCommandEncoder): void;
  }
  export class PrefixSumKernel {
    constructor(options: { device: GPUDevice; data: GPUBuffer; count: number });
    dispatch(encoder: GPUCommandEncoder): void;
  }
}
