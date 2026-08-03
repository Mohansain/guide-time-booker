import { reportLovableError } from "./lovable-error-reporting";

export type AlertSeverity = "warning" | "critical";

export type Alert = {
  key: string;
  severity: AlertSeverity;
  message: string;
  detail?: Record<string, unknown>;
};

/** Core Web Vitals alert thresholds (ms, except CLS which is score*1000). */
export const VITAL_THRESHOLDS: Record<string, { warning: number; critical: number }> = {
  LCP: { warning: 2500, critical: 4000 },
  INP: { warning: 200, critical: 500 },
  CLS: { warning: 100, critical: 250 },
  TTFB: { warning: 800, critical: 1800 },
};

const ALERT_COOLDOWN_MS = 60_000;
const ERROR_BURST_WINDOW_MS = 30_000;
const ERROR_BURST_LIMIT = 3;

const lastSent = new Map<string, number>();
const recentErrors: number[] = [];

function throttled(key: string) {
  const now = Date.now();
  const previous = lastSent.get(key);
  if (previous && now - previous < ALERT_COOLDOWN_MS) return true;
  lastSent.set(key, now);
  return false;
}

/**
 * Emits an alert as greppable console output. Only alerts that represent a real
 * failure (`forward: true`) go to error reporting — performance-threshold alerts
 * must not surface as runtime errors.
 */
export function raiseAlert(alert: Alert & { forward?: boolean }) {
  if (throttled(alert.key)) return;

  const payload = {
    severity: alert.severity,
    key: alert.key,
    message: alert.message,
    url: typeof window === "undefined" ? undefined : window.location.pathname,
    ...alert.detail,
  };

  if (alert.severity === "critical") console.error(`[alert] ${alert.message}`, payload);
  else console.warn(`[alert] ${alert.message}`, payload);

  if (alert.forward) {
    reportLovableError(new Error(`[alert:${alert.severity}] ${alert.message}`), payload);
  }
}


/** Alert when a Core Web Vital crosses its threshold. */
export function checkVitalAlert(name: string, value: number) {
  const thresholds = VITAL_THRESHOLDS[name];
  if (!thresholds) return;
  const severity: AlertSeverity | null =
    value >= thresholds.critical ? "critical" : value >= thresholds.warning ? "warning" : null;
  if (!severity) return;

  raiseAlert({
    key: `vital:${name}:${severity}`,
    severity,
    message: `${name} degraded (${Math.round(value)})`,
    detail: { metric: name, value: Math.round(value), threshold: thresholds[severity] },
  });
}

/** Tracks client errors and alerts on a burst within the rolling window. */
export function trackErrorForAlerting(message: string) {
  const now = Date.now();
  recentErrors.push(now);
  while (recentErrors.length && now - recentErrors[0]! > ERROR_BURST_WINDOW_MS) recentErrors.shift();

  if (recentErrors.length >= ERROR_BURST_LIMIT) {
    raiseAlert({
      key: "error-burst",
      severity: "critical",
      message: `${recentErrors.length} client errors in ${ERROR_BURST_WINDOW_MS / 1000}s`,
      detail: { lastError: message },
    });
  }
}
