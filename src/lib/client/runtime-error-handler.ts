const BENIGN_ERROR_MESSAGES = [
  "ResizeObserver loop",
  "ResizeObserver loop completed with undelivered notifications",
];

function isBenignMessage(message: string) {
  return BENIGN_ERROR_MESSAGES.some((fragment) => message.includes(fragment));
}

function isNextChunkScript(target: EventTarget | null | undefined) {
  if (!(target instanceof HTMLScriptElement)) return false;
  const src = target.src ?? "";
  return src.includes("/_next/static/chunks/");
}

function isChunkLoadFailure(reason: unknown) {
  if (!reason) return false;
  if (reason instanceof Error) {
    return reason.name === "ChunkLoadError" || /loading chunk|chunk load/i.test(reason.message);
  }
  return /loading chunk|chunk load/i.test(String(reason));
}

export function installRuntimeErrorRecovery() {
  if (typeof window === "undefined") return () => {};

  const reloadForStaleAssets = () => {
    const key = "neural_ops_chunk_reload";
    const last = Number(sessionStorage.getItem(key) ?? "0");
    const now = Date.now();
    if (now - last < 10_000) return;
    sessionStorage.setItem(key, String(now));
    window.location.reload();
  };

  const onError = (event: Event) => {
    const errorEvent = event as ErrorEvent;
    const message = errorEvent.message ?? "";

    if (message && isBenignMessage(message)) {
      event.preventDefault();
      return;
    }

    if (isNextChunkScript(errorEvent.target)) {
      event.preventDefault();
      reloadForStaleAssets();
    }
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    if (event.reason instanceof Event || isChunkLoadFailure(event.reason)) {
      event.preventDefault();
      reloadForStaleAssets();
    }
  };

  window.addEventListener("error", onError, true);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError, true);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}

export function formatClientError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const maybeEvent = error as ErrorEvent;
    if (typeof maybeEvent.message === "string" && maybeEvent.message.trim()) {
      return maybeEvent.message;
    }
  }
  return "A runtime error occurred. Refresh the page to load the latest app bundle.";
}
