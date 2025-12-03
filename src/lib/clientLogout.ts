export async function clientLogout(redirectTo: string = '/login/role') {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore network errors; still clear client state
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('authUser');
      // Keep these for backward compatibility if you decide to still use them:
      window.localStorage.removeItem('secUserName');
      window.localStorage.removeItem('secId');
    } catch {
      // ignore storage errors
    }

    window.location.href = redirectTo;
  }
}
