import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface HttpRequestLike {
  auditUserId?: bigint;
}

export const AuditUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): bigint | undefined => {
    const request = ctx.switchToHttp().getRequest<HttpRequestLike>();
    return request.auditUserId;
  },
);
