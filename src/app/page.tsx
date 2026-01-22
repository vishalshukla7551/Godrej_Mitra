import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { getHomePathForRole, VALID_ROLES } from '@/lib/roleHomePath';
import LandingRedirect from '@/components/LandingRedirect';
import Maintenance from '@/components/Maintenance';

export default async function Home() {
  const isMaintenance = process.env.IS_MAINTENANCE === 'true' || process.env.NEXT_PUBLIC_IS_MAINTENANCE === 'true';

  if (isMaintenance) {
    return <Maintenance />;
  }
  // In page components we must not mutate cookies; pass mutateCookies: false so
  // getAuthenticatedUserFromCookies only reads tokens and does not rotate them.
  const authUser = await getAuthenticatedUserFromCookies(undefined, { mutateCookies: false });

  let redirectTo = '/login/canvasser';

  if (authUser) {
    // Validate that role is valid
    if (!VALID_ROLES.includes(authUser.role)) {
      // Invalid role - trigger logout on client side
      redirectTo = '/invalid-role';
    } else {
      redirectTo = getHomePathForRole(authUser.role);
    }
  }

  return <LandingRedirect redirectTo={redirectTo} />;
}
