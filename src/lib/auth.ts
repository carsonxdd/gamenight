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
        await prisma.user.upsert({
          where: { discordId: account.providerAccountId },
          update: {
            name: user.name || "Unknown",
            avatar: user.image,
          },
          create: {
            discordId: account.providerAccountId,
            name: user.name || "Unknown",
            avatar: user.image,
          },
        });
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
      return session;
    },
  },
  pages: {
    signIn: "/signup",
  },
};
