export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function safeError(err: any, fallback: string = 'An error occurred'): string {
  if (!err) return fallback;
  const detail = err?.response?.data?.detail || err?.detail || err?.message || err?.statusText || fallback;
  return typeof detail === 'string' ? detail : JSON.stringify(detail);
}
