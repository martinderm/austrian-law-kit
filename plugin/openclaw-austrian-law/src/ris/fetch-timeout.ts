import type { ToolError } from "../types/shared.js";

export const DEFAULT_FETCH_TIMEOUT_MS = 15000;
export const MAX_FETCH_TIMEOUT_MS = 120000;
export const FETCH_TIMEOUT_ENV = "OPENCLAW_AUSTRIAN_LAW_FETCH_TIMEOUT_MS";

export type FetchAbortKind = "timeout" | "cancelled";
export type FetchPhase = "request" | "body_read";

const warnedInvalidValues = new Set<string>();

export class FetchTimeoutConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchTimeoutConfigError";
  }
}

export class FetchAbortError extends Error {
  readonly kind: FetchAbortKind;

  constructor(kind: FetchAbortKind) {
    super(kind === "timeout" ? "Upstream request timed out" : "Upstream request aborted by caller");
    this.name = "FetchAbortError";
    this.kind = kind;
  }
}

export interface FetchAbortHandle {
  signal: AbortSignal;
  cancel: () => void;
  timedOut: () => boolean;
  cancelled: () => boolean;
}

function isValidTimeoutMs(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= MAX_FETCH_TIMEOUT_MS;
}

export function resolveFetchTimeoutMs(input?: { timeoutMs?: number }): number {
  if (input?.timeoutMs !== undefined) {
    if (!isValidTimeoutMs(input.timeoutMs)) {
      throw new FetchTimeoutConfigError(`timeoutMs must be a positive integer <= ${MAX_FETCH_TIMEOUT_MS}`);
    }
    return input.timeoutMs;
  }

  const raw = process.env[FETCH_TIMEOUT_ENV];
  if (raw !== undefined && raw.trim().length > 0) {
    const parsed = Number(raw);
    if (isValidTimeoutMs(parsed)) return parsed;
    if (!warnedInvalidValues.has(raw)) {
      warnedInvalidValues.add(raw);
      console.warn(JSON.stringify({
        source: "austrian-law-kit",
        event: "invalid_fetch_timeout_config",
        env: FETCH_TIMEOUT_ENV,
        value: raw,
        fallback_ms: DEFAULT_FETCH_TIMEOUT_MS,
      }));
    }
    return DEFAULT_FETCH_TIMEOUT_MS;
  }

  return DEFAULT_FETCH_TIMEOUT_MS;
}

export function createFetchAbortSignal(timeoutMs: number, externalSignal?: AbortSignal): FetchAbortHandle {
  const deadlineSignal = AbortSignal.timeout(timeoutMs);
  const signal = externalSignal ? AbortSignal.any([deadlineSignal, externalSignal]) : deadlineSignal;
  return {
    signal,
    cancel: () => undefined,
    timedOut: () => deadlineSignal.aborted && !(externalSignal?.aborted ?? false),
    cancelled: () => (externalSignal?.aborted ?? false) && !deadlineSignal.aborted,
  };
}

function isAbortLikeError(error: unknown): boolean {
  const name = (error as { name?: unknown } | null | undefined)?.name;
  return name === "AbortError" || name === "TimeoutError";
}

export function buildAbortError(handle: FetchAbortHandle): FetchAbortError {
  return new FetchAbortError(handle.timedOut() ? "timeout" : "cancelled");
}

export function classifyFetchAbort(error: unknown, handle: FetchAbortHandle): FetchAbortKind | undefined {
  if (error instanceof FetchAbortError) return error.kind;
  if (!handle.signal.aborted) return undefined;
  if (!isAbortLikeError(error)) return undefined;
  return handle.timedOut() ? "timeout" : "cancelled";
}

export async function raceWithFetchDeadline<T>(promise: Promise<T>, handle: FetchAbortHandle): Promise<T> {
  if (handle.signal.aborted) {
    throw buildAbortError(handle);
  }

  let onAbort: (() => void) | undefined;
  const deadlinePromise = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(buildAbortError(handle));
    handle.signal.addEventListener("abort", onAbort, { once: true });
  });

  try {
    return await Promise.race([promise, deadlinePromise]);
  } finally {
    if (onAbort) handle.signal.removeEventListener("abort", onAbort);
  }
}

export async function readResponseBodyText(response: Response, handle: FetchAbortHandle): Promise<string> {
  try {
    return await raceWithFetchDeadline(response.text(), handle);
  } catch (error) {
    await response.body?.cancel().catch(() => undefined);
    throw error;
  }
}

export function buildAbortToolError(params: {
  kind: FetchAbortKind;
  phase: FetchPhase;
  url: string;
  timeoutMs: number;
}): ToolError {
  if (params.kind === "timeout") {
    return {
      code: "UPSTREAM_TIMEOUT",
      message: `Upstream request timed out after ${params.timeoutMs}ms during ${params.phase}`,
      details: {
        phase: params.phase,
        timed_out_phase: params.phase,
        url: params.url,
        timeout_ms: params.timeoutMs,
      },
      retryable: true,
    };
  }

  return {
    code: "CANCELLED",
    message: "Upstream request aborted by caller",
    details: { phase: params.phase, url: params.url },
    retryable: false,
  };
}
