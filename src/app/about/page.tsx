import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMyRecentSuggestions } from "@/app/suggestions/actions";
import AboutPageClient from "@/components/about/AboutPageClient";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AboutPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.id;
  const params = await searchParams;

  const mySuggestions = isLoggedIn ? await getMyRecentSuggestions() : [];

  return (
    <AboutPageClient
      mySuggestions={mySuggestions}
      isMuted={session?.user?.isMuted ?? false}
      isLoggedIn={isLoggedIn}
      initialTab={params.tab as "About" | "Changelog" | "FAQ" | "Feedback" | undefined}
    />
  );
}
