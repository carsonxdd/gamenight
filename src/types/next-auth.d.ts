import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      discordId: string;
      name: string;
      email?: string | null;
      image?: string | null;
      gamertag: string | null;
      isAdmin: boolean;
      isModerator: boolean;
      isOwner: boolean;
      willingToModerate: boolean;
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
  }
}
