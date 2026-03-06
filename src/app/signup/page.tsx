import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DiscordLoginButton from "@/components/signup/DiscordLoginButton";
import ProfileForm from "@/components/signup/ProfileForm";
import Card from "@/components/ui/Card";

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);

  // If profile is complete, redirect to schedule
  if (session?.user?.gamertag) {
    redirect("/schedule");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-center text-3xl font-bold text-foreground">
        Join Game Night
      </h1>
      <p className="mb-8 text-center text-foreground/50">
        {session
          ? "Complete your profile to get started"
          : "Sign in with Discord to get started"}
      </p>

      <Card className="p-6 sm:p-8">
        {session ? (
          <ProfileForm defaultName={session.user.name ?? undefined} />
        ) : (
          <div className="flex flex-col items-center gap-6 py-8">
            <p className="text-foreground/60">
              Connect your Discord account to join
            </p>
            <DiscordLoginButton />
            <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-border bg-surface-lighter p-4 text-left">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-neon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-foreground/50 leading-relaxed">
                We only receive your Discord <span className="text-foreground/70">username</span> and <span className="text-foreground/70">profile picture</span>. We cannot see your password, email, DMs, friends list, or servers. Discord handles the login — your credentials never touch our site.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
