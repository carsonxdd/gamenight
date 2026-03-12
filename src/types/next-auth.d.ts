import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      discordId: string;
      name: string;
      image?: string | null;
      gamertag: string | null;
      isAdmin: boolean;
      isModerator: boolean;
      isOwner: boolean;
      willingToModerate: boolean;
      timezone: string;
      approvalStatus: string | null;
      isMuted: boolean;
      mutedUntil: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    discordId?: string;
    gamertag?: string | null;
    isAdmin?: boolean;
    isModerator?: boolean;
    isOwner?: boolean;
    willingToModerate?: boolean;
    timezone?: string;
    approvalStatus?: string | null;
    isMuted?: boolean;
    mutedUntil?: string | null;
  }
}
