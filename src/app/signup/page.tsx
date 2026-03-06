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
          </div>
        )}
      </Card>
    </div>
  );
}
