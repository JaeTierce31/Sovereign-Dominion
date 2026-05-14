"""
Neural Kuramoto Oscillator training script for Esther voice prosody.
Trains coupling strength K_vt from audio samples.
"""

import numpy as np
from typing import Tuple


def kuramoto_step(theta_v: float, theta_t: float, omega_v: float, omega_t: float,
                  k_vt: float, dt: float = 0.001) -> Tuple[float, float]:
    """Single integration step of the Kuramoto oscillator system."""
    dtheta_v = omega_v + k_vt * np.sin(theta_t - theta_v)
    dtheta_t = omega_t + k_vt * np.sin(theta_v - theta_t)
    return theta_v + dtheta_v * dt, theta_t + dtheta_t * dt


def compute_order_parameter(theta_v: float, theta_t: float) -> float:
    """Compute synchronization order parameter r ∈ [0, 1]."""
    phasors = np.array([np.exp(1j * theta_v), np.exp(1j * theta_t)])
    return abs(np.mean(phasors))


def simulate_prosody(k_vt: float, steps: int = 1000) -> np.ndarray:
    """Simulate voice prosody coupling and return EmotionalWeight time series."""
    theta_v, theta_t = 0.0, 0.5
    omega_v, omega_t = 2 * np.pi * 2.0, 2 * np.pi * 2.3  # Hz
    weights = []

    for _ in range(steps):
        theta_v, theta_t = kuramoto_step(theta_v, theta_t, omega_v, omega_t, k_vt)
        r = compute_order_parameter(theta_v, theta_t)
        weights.append(1.0 + 0.85 * r)

    return np.array(weights)


if __name__ == '__main__':
    print('Neural Kuramoto prosody simulator')
    print('Training coupling strength K_vt...')

    k_values = np.linspace(0.1, 5.0, 50)
    best_k = 0.0
    best_sync = 0.0

    for k in k_values:
        weights = simulate_prosody(k)
        sync = np.std(weights)
        if sync > best_sync:
            best_sync = sync
            best_k = k

    print(f'Optimal K_vt: {best_k:.3f} (synchronization variance: {best_sync:.4f})')
    print(f'EmotionalWeight range: [{simulate_prosody(best_k).min():.3f}, {simulate_prosody(best_k).max():.3f}]')
