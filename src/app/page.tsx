import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { getHomePathForRole } from '@/lib/roleHomePath';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function Home() {
  // In page components we must not mutate cookies; pass mutateCookies: false so
  // getAuthenticatedUserFromCookies only reads tokens and does not rotate them.
  const authUser = await getAuthenticatedUserFromCookies(undefined, { mutateCookies: false });

  if (authUser) {
    const target = getHomePathForRole(authUser.role);
    redirect(target);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white font-[family-name:var(--font-plus-jakarta-sans)]">
      <Image 
        src="/Godrej_Enterprises_Group.svg.png" 
        alt="Godrej Enterprises Group" 
        width={400} 
        height={200}
        priority
      />
    </main>
  );
}
