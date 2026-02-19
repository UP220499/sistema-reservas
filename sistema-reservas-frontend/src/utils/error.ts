import axios from 'axios';

interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const { message, error } = candidate;

  const validMessage =
    message === undefined ||
    typeof message === 'string' ||
    (Array.isArray(message) && message.every((item) => typeof item === 'string'));

  const validError = error === undefined || typeof error === 'string';

  return validMessage && validError;
}

export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;

    if (isApiErrorBody(payload)) {
      if (Array.isArray(payload.message)) {
        return payload.message.join(', ');
      }

      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message;
      }

      if (typeof payload.error === 'string' && payload.error.trim()) {
        return payload.error;
      }
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
