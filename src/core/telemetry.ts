let posthogInstance: any = null;

export async function initTelemetry(key: string, host?: string) {
  const { default: posthog } = await import('posthog-js');
  posthog.init(key, { api_host: host ?? 'https://app.posthog.com', autocapture: false });
  posthogInstance = posthog;
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  posthogInstance?.capture(event, properties);
}

export function setUser(userId: string, traits?: Record<string, any>) {
  posthogInstance?.identify(userId, traits);
}

export function resetUser() {
  posthogInstance?.reset();
}
