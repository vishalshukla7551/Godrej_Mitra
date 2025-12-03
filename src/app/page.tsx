import AnimatedText from '@/components/AnimatedText';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { getHomePathForRole } from '@/lib/roleHomePath';
import { redirect } from 'next/navigation';

export default async function Home() {
  const authUser = await getAuthenticatedUserFromCookies();

  if (authUser) {
    const target = getHomePathForRole(authUser.role);
    redirect(target);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black font-[family-name:var(--font-plus-jakarta-sans)]">
      <AnimatedText />
    </main>
  );
}
