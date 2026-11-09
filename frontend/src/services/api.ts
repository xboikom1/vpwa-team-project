const BASE_URL = import.meta.env.API_URL;
const TOKEN_KEY = 'chatflow.token';

export interface ApiErrorItem {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly items: ApiErrorItem[];

  constructor(status: number, message: string, items: ApiErrorItem[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.items = items;
  }
}

let unauthorizedHandler: (() => void) | null = null;

export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    return;
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    return;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  handleUnauthorized?: boolean;
}

function parseItems(payload: unknown): ApiErrorItem[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const errors = (payload as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return [];

  return errors.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const { field, message } = entry as { field?: unknown; message?: unknown };
    if (typeof message !== 'string') return [];
    return [typeof field === 'string' ? { field, message } : { message }];
  });
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, handleUnauthorized = true } = options;
  const token = getToken();

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token !== null) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? null : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  const payload: unknown = await response.json().catch(() => null);

  if (response.ok) return payload as T;

  if (response.status === 401 && token !== null && handleUnauthorized) {
    clearToken();
    unauthorizedHandler?.();
  }

  const items = parseItems(payload);
  throw new ApiError(
    response.status,
    items[0]?.message ?? 'Something went wrong. Try again.',
    items,
  );
}
