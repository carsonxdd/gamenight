import { prisma } from "./prisma";

export function logAudit(params: {
  action: string;
  entityType: string;
  entityId?: string;
  actorId: string;
  metadata?: Record<string, unknown>;
}): void {
  // Fire-and-forget — don't await, don't block the caller
  prisma.auditLog
    .create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        actorId: params.actorId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    })
    .catch(() => {
      // Silently ignore audit write failures
    });
}
