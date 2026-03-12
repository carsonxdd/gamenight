import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "./prisma";
import { logAudit } from "./audit";

// Throttle lastSeenAt writes: max once per 5 minutes per user
const lastSeenCache = new Map<string, number>();
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        url: "https://discord.com/api/oauth2/authorize",
        params: { scope: "identify" },
      },
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
          // Update name/avatar and lastSeenAt for returning users
          await prisma.user.update({
            where: { discordId: account.providerAccountId },
            data: { name: user.name || "Unknown", avatar: user.image, lastSeenAt: new Date() },
          });
        } else {
          // New user — check joinMode for approval status
          const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
          const joinMode = settings?.joinMode || "open";

          // Block new signups in invite_only mode (must redeem code on signup page first)
          // For approval mode, create with "pending" status
          const approvalStatus = joinMode === "approval" ? "pending" : null;

          const newUser = await prisma.user.create({
            data: {
              discordId: account.providerAccountId,
              name: user.name || "Unknown",
              avatar: user.image,
              approvalStatus,
              lastSeenAt: new Date(),
            },
          });

          logAudit({
            action: "USER_JOINED",
            entityType: "User",
            entityId: newUser.id,
            actorId: newUser.id,
            metadata: { name: newUser.name },
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

          // Throttled lastSeenAt update + weekly streak evaluation
          const now = Date.now();
          const lastUpdate = lastSeenCache.get(dbUser.id) ?? 0;
          if (now - lastUpdate > LAST_SEEN_THROTTLE_MS) {
            lastSeenCache.set(dbUser.id, now);
            prisma.user
              .update({
                where: { id: dbUser.id },
                data: { lastSeenAt: new Date() },
              })
              .catch(() => {});

            // Evaluate weekly activity streak (has its own 1hr internal gate)
            import("@/lib/badges/streaks").then(({ evaluateWeeklyStreak }) =>
              evaluateWeeklyStreak(dbUser.id).catch(() => {})
            );
          }
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
