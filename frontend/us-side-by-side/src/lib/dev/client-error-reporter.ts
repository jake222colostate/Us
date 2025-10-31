const ENDPOINT = "/__client-log";
let isInitialized = false;

const send = (payload: Record<string, unknown>) => {
  const body = JSON.stringify({
    ...payload,
    userAgent: navigator.userAgent,
    url: window.location.href,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(ENDPOINT, blob);
    return;
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  });
};

export const installClientErrorReporter = () => {
  if (isInitialized) return;
  isInitialized = true;

  window.addEventListener("error", (event) => {
    send({
      message: event.message,
      stack: event.error?.stack,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      type: "error",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as { message?: string; stack?: string } | string;
    const message =
      typeof reason === "string" ? reason : reason?.message ?? "Unhandled rejection";

    send({
      message,
      stack: typeof reason === "string" ? undefined : reason?.stack,
      type: "unhandledrejection",
    });
  });
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    isInitialized = false;
  });
}
