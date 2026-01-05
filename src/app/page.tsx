import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { getHomePathForRole } from '@/lib/roleHomePath';
import LandingRedirect from '@/components/LandingRedirect';

export default async function Home() {
  // In page components we must not mutate cookies; pass mutateCookies: false so
  // getAuthenticatedUserFromCookies only reads tokens and does not rotate them.
  const authUser = await getAuthenticatedUserFromCookies(undefined, { mutateCookies: false });

  let redirectTo = '/login/sec';
  
  if (authUser) {
    redirectTo = getHomePathForRole(authUser.role);
  }

  return <LandingRedirect redirectTo={redirectTo} />;
}
