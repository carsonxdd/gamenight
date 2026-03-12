import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DiscordLoginButton from "@/components/signup/DiscordLoginButton";
import ProfileForm from "@/components/signup/ProfileForm";
import Card from "@/components/ui/Card";
import { getSiteSettings } from "@/app/admin/settings-actions";
import InviteCodeGate from "@/components/signup/InviteCodeGate";

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);
  const settings = await getSiteSettings();

  // If profile is complete and approved, redirect to schedule
  const isApproved = !session?.user?.approvalStatus || session.user.approvalStatus === "approved";
  if (session?.user?.gamertag && isApproved) {
    redirect("/schedule");
  }

  // User is logged in but pending approval
  if (session && session.user.approvalStatus === "pending") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mb-6 text-5xl">&#9203;</div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Awaiting Approval</h1>
        <p className="mb-4 text-foreground/50">
          Your account is pending admin approval. You&apos;ll be able to access everything once approved.
        </p>
        <p className="text-sm text-foreground/30">
          Signed in as {session.user.name}
        </p>
      </div>
    );
  }

  // User is logged in but rejected
  if (session && session.user.approvalStatus === "rejected") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="mb-2 text-3xl font-bold text-danger">Access Denied</h1>
        <p className="text-foreground/50">
          Your account was not approved. Contact an admin if you think this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-center text-3xl font-bold text-foreground">
        Join {settings.communityName}
      </h1>
      <p className="mb-8 text-center text-foreground/50">
        {session
          ? "Complete your profile to get started"
          : "Sign in with Discord to get started"}
      </p>

      <Card className="p-6 sm:p-8">
        {session ? (
          <ProfileForm
            defaultName={session.user.name ?? undefined}
            primeStartHour={settings.primeStartHour}
            primeEndHour={settings.primeEndHour}
            extendedStartHour={settings.extendedStartHour}
            extendedEndHour={settings.extendedEndHour}
            anchorTimezone={settings.anchorTimezone}
          />
        ) : (
          <div className="flex flex-col items-center gap-6 py-8">
            {settings.joinMode === "invite_only" ? (
              <InviteCodeGate />
            ) : (
              <>
                <p className="text-foreground/60">
                  Connect your Discord account to join
                </p>
                <DiscordLoginButton />
                {settings.joinMode === "approval" && (
                  <p className="text-xs text-foreground/40 text-center">
                    New accounts require admin approval before you can access features.
                  </p>
                )}
                <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-border bg-surface-lighter p-4 text-left">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-neon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-foreground/50 leading-relaxed">
                    We only request Discord&apos;s &quot;identify&quot; scope — the only info we receive is your <span className="text-foreground/70">username</span> and <span className="text-foreground/70">profile picture</span>. We don&apos;t ask for your email, and we cannot see your password, DMs, friends list, or servers. Discord handles the login — your credentials never touch our site.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
