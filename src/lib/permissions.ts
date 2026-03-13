export function canEditEvent(params: {
  userId?: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  isOwner?: boolean;
  hostId?: string | null;
  createdById: string | null;
  visibility: string;
}): boolean {
  if (!params.userId) return false;
  if (params.isAdmin || params.isModerator || params.isOwner) return true;
  if (params.userId === params.hostId) return true;
  if (params.userId === params.createdById && params.visibility === "invite_only") return true;
  return false;
}
