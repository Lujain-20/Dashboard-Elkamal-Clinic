import axios from 'axios';

export function isAbortError(error: unknown): boolean {
  if (axios.isCancel(error)) return true;
  return typeof error === 'object' && error !== null && (error as any).name === 'AbortError';
}

/**
 * يحاول يستخرج رسالة خطأ حقيقية من رد الباك إند (ASP.NET-style غالبًا حسب الـ baseURL).
 * يدعم: { message }, { title } (ProblemDetails), { errors: [...] }, { errors: { field: [...] } }
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) return fallback;
  const err = error as any;

  if (!err.response) {
    if (err.message === 'Network Error') return 'تعذر الاتصال بالخادم، تأكد من اتصالك بالإنترنت';
    return fallback;
  }

  const data = err.response.data;
  if (!data) return fallback;

  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  if (typeof data.title === 'string' && data.title.trim()) return data.title;
  if (typeof data.error === 'string' && data.error.trim()) return data.error;

  if (Array.isArray(data.errors) && data.errors.length) {
    const first = data.errors[0];
    if (typeof first === 'string') return first;
    if (typeof first?.message === 'string') return first.message;
  }

  // شكل ASP.NET validation errors: { errors: { FieldName: ["msg"] } }
  if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    const firstKey = Object.keys(data.errors)[0];
    const firstVal = firstKey ? data.errors[firstKey] : null;
    if (Array.isArray(firstVal) && firstVal.length) return firstVal[0];
  }

  return fallback;
}