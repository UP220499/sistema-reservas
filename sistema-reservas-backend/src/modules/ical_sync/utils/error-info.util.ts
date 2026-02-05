import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime/library';

export interface IcalErrorInfo {
  error_name: string;
  error_type: string;
  message: string;
  prisma_code?: string;
  prisma_meta_cause?: string;
  postgres_code?: string;
  stack?: string;
}

export function extractIcalErrorInfo(error: unknown): IcalErrorInfo {
  return extractIcalErrorInfoInternal(error, new Set());
}

function extractIcalErrorInfoInternal(
  error: unknown,
  seen: Set<unknown>,
): IcalErrorInfo {
  if (seen.has(error)) {
    return {
      error_name: 'CircularReference',
      error_type: 'CircularReference',
      message: 'Circular reference detected while inspecting error cause.',
    };
  }

  seen.add(error);

  const baseInfo: IcalErrorInfo = {
    error_name: getErrorName(error),
    error_type: getErrorType(error),
    message: getErrorMessage(error),
    stack: getErrorStack(error),
  };

  if (error instanceof PrismaClientKnownRequestError) {
    baseInfo.prisma_code = error.code;
    const metaCause = getMetaCause(error.meta?.cause);
    if (metaCause) {
      baseInfo.prisma_meta_cause = metaCause;
      baseInfo.postgres_code =
        baseInfo.postgres_code ?? findPostgresErrorCode(metaCause);
    }

    baseInfo.postgres_code =
      baseInfo.postgres_code ?? findPostgresErrorCode(error.message);
  }

  if (error instanceof PrismaClientUnknownRequestError) {
    baseInfo.postgres_code =
      baseInfo.postgres_code ?? findPostgresErrorCode(error.message);
  }

  const cause = getErrorCause(error);
  if (cause !== undefined) {
    const causeInfo = extractIcalErrorInfoInternal(cause, seen);

    baseInfo.prisma_code = baseInfo.prisma_code ?? causeInfo.prisma_code;
    baseInfo.prisma_meta_cause =
      baseInfo.prisma_meta_cause ?? causeInfo.prisma_meta_cause;
    baseInfo.postgres_code = baseInfo.postgres_code ?? causeInfo.postgres_code;

    if (causeInfo.stack && !baseInfo.stack) {
      baseInfo.stack = causeInfo.stack;
    }

    if (causeInfo.message && causeInfo.message !== baseInfo.message) {
      baseInfo.message = `${baseInfo.message} | cause: ${causeInfo.message}`;
    }
  }

  return baseInfo;
}

function getErrorName(error: unknown): string {
  if (error instanceof Error) {
    return error.name;
  }

  return typeof error;
}

function getErrorType(error: unknown): string {
  if (error instanceof Error) {
    return error.constructor.name;
  }

  return typeof error;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error && typeof error.stack === 'string') {
    return error.stack;
  }

  const cause = getErrorCause(error);
  if (cause !== undefined && cause !== error) {
    return getErrorStack(cause);
  }

  return undefined;
}

function getErrorCause(error: unknown): unknown {
  if (error && typeof error === 'object' && 'cause' in error) {
    return (error as { cause?: unknown }).cause;
  }

  return undefined;
}

function getMetaCause(metaCause: unknown): string | undefined {
  if (typeof metaCause === 'string') {
    return metaCause;
  }

  if (metaCause && typeof metaCause === 'object') {
    const maybeCause = (metaCause as { cause?: unknown }).cause;
    if (typeof maybeCause === 'string') {
      return maybeCause;
    }
  }

  return undefined;
}

function findPostgresErrorCode(text: string | undefined): string | undefined {
  if (!text) {
    return undefined;
  }

  const match = text.match(/\b[0-9]{2}[A-Z0-9]{3}\b/);
  return match ? match[0] : undefined;
}
