import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "discord") {
        // Check if user already exists (returning user)
        const existing = await prisma.user.findUnique({
          where: { discordId: account.providerAccountId },
        });

        if (existing) {
          // Update name/avatar for returning users
          await prisma.user.update({
            where: { discordId: account.providerAccountId },
            data: { name: user.name || "Unknown", avatar: user.image },
          });
        } else {
          // New user — check joinMode for approval status
          const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
          const joinMode = settings?.joinMode || "open";

          // Block new signups in invite_only mode (must redeem code on signup page first)
          // For approval mode, create with "pending" status
          const approvalStatus = joinMode === "approval" ? "pending" : null;

          await prisma.user.create({
            data: {
              discordId: account.providerAccountId,
              name: user.name || "Unknown",
              avatar: user.image,
              approvalStatus,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.discordId = account.providerAccountId;
      }
      if (token.discordId) {
        const dbUser = await prisma.user.findUnique({
          where: { discordId: token.discordId as string },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.gamertag = dbUser.gamertag;
          token.isAdmin = dbUser.isAdmin;
          token.isModerator = dbUser.isModerator;
          token.isOwner = dbUser.isOwner;
          token.willingToModerate = dbUser.willingToModerate;
          token.timezone = dbUser.timezone;
          token.approvalStatus = dbUser.approvalStatus;
          token.isMuted = dbUser.isMuted;
          token.mutedUntil = dbUser.mutedUntil?.toISOString() ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.discordId = token.discordId as string;
      session.user.gamertag = token.gamertag as string | null;
      session.user.isAdmin = token.isAdmin as boolean;
      session.user.isModerator = token.isModerator as boolean;
      session.user.isOwner = token.isOwner as boolean;
      session.user.willingToModerate = token.willingToModerate as boolean;
      session.user.timezone = (token.timezone as string) || "America/Phoenix";
      session.user.approvalStatus = (token.approvalStatus as string | null) ?? null;
      session.user.isMuted = (token.isMuted as boolean) || false;
      session.user.mutedUntil = (token.mutedUntil as string | null) ?? null;
      return session;
    },
  },
  pages: {
    signIn: "/signup",
  },
};
