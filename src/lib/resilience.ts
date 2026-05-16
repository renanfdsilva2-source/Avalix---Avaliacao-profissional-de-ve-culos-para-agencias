const DEFAULT_TIMEOUT_MS = 15000;

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Erro desconhecido");
  }
  return String(error || "Erro desconhecido");
};

export async function withTimeout<T>(promise: PromiseLike<T>, label: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} excedeu ${Math.round(timeoutMs / 1000)}s sem resposta.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function retryWithBackoff<T>(
  operation: () => PromiseLike<T>,
  options: { label: string; retries?: number; baseDelayMs?: number; timeoutMs?: number },
): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 600;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      console.info(`[Avalix Sync] ${options.label}: tentativa ${attempt}/${retries}`);
      return await withTimeout(operation(), options.label, options.timeoutMs);
    } catch (error) {
      lastError = error;
      const message = getErrorMessage(error);
      console.warn(`[Avalix Sync] ${options.label}: falha na tentativa ${attempt}/${retries}`, message, error);
      if (attempt < retries) {
        const delay = baseDelayMs * 2 ** (attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(getErrorMessage(lastError));
}