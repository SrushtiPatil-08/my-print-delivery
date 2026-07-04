// PostHog analytics — no-op when VITE_POSTHOG_KEY is missing.
import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;
  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string) || "https://us.i.posthog.com",
    capture_pageview: true,
    autocapture: true,
  });
  initialized = true;
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(name, props);
}

export function identifyUser(id: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(id, props);
}

export function resetAnalytics() {
  if (!initialized) return;
  posthog.reset();
}
