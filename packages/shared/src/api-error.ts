/**
 * 前端 API 层共享基础设施。
 * 两个站点共享 ApiError 类、错误提取、可读消息映射。
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 从 API 响应 payload 中提取错误消息 */
export function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) return null;
  const error = (payload as { error?: unknown }).error;
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : null;
  }
  return null;
}

/** 站点级别的消息映射配置 */
export interface ReadableMessageConfig {
  sessionExpired: string;
  forbidden: string;
  serverError: string;
  networkError: string;
  defaultError: string;
  /** 额外的原文透传白名单 */
  passthroughMessages?: string[];
}

/** 生成站点级可读消息映射函数 */
export function createReadableMessage(config: ReadableMessageConfig) {
  return function readableMessage(message: string, status?: number): string {
    if (status === 401) return config.sessionExpired;
    if (status === 403) return config.forbidden;
    if (status && status >= 500) return config.serverError;

    if (message === 'Failed to fetch' || message === 'NetworkError when attempting to fetch resource.') {
      return config.networkError;
    }

    if (config.passthroughMessages?.includes(message)) return message;

    return message || config.defaultError;
  };
}

/** 从 catch 中的 unknown 提取可读错误消息 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}
