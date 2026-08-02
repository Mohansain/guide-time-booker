import { reportLovableError } from "./lovable-error-reporting";

type Metric = { name: string; value: number };

function log(kind: string, payload: Record<string, unknown>) {
  // Structured, greppable client telemetry. Swap the sink here if you later
  // forward to an external monitoring provider.
  console.info(`[monitor] ${kind}`, payload);
}

/**
 * Client-side monitoring: unhandled errors, promise rejections, and core web
 * vitals (LCP, CLS, INP) using native PerformanceObserver — no extra deps.
 * Returns a cleanup function.
 */
export function startMonitoring(): () => void {
  if (typeof window === "undefined") return () => {};

  const onError = (event: ErrorEvent) => {
    log("error", { message: event.message, filename: event.filename });
    reportLovableError(event.error ?? event.message, { boundary: "window_onerror" });
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    log("unhandledrejection", { reason: String(event.reason) });
    reportLovableError(event.reason, { boundary: "unhandledrejection" });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  const observers: PerformanceObserver[] = [];
  const observe = (type: string, handler: (list: PerformanceObserverEntryList) => void) => {
    try {
      const observer = new PerformanceObserver(handler);
      observer.observe({ type, buffered: true } as PerformanceObserverInit);
      observers.push(observer);
    } catch {
      /* metric unsupported in this browser */
    }
  };

  const report = ({ name, value }: Metric) => log("vital", { name, value: Math.round(value) });

  observe("largest-contentful-paint", (list) => {
    const last = list.getEntries().at(-1);
    if (last) report({ name: "LCP", value: last.startTime });
  });

  let cls = 0;
  observe("layout-shift", (list) => {
    for (const entry of list.getEntries() as unknown as Array<{
      value: number;
      hadRecentInput: boolean;
    }>) {
      if (!entry.hadRecentInput) cls += entry.value;
    }
    report({ name: "CLS", value: cls * 1000 });
  });

  observe("event", (list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration >= 200) report({ name: "INP", value: entry.duration });
    }
  });

  observe("navigation", (list) => {
    const nav = list.getEntries()[0] as PerformanceNavigationTiming | undefined;
    if (nav) report({ name: "TTFB", value: nav.responseStart });
  });

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    for (const observer of observers) observer.disconnect();
  };
}
