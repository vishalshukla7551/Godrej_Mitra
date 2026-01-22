export async function clientLogout(redirectTo: string = '/login/role') {
  if (typeof window !== 'undefined') {
    try {
      // Clear localStorage IMMEDIATELY so we don't depend on the fetch resolving
      window.localStorage.removeItem('authUser');
      window.localStorage.removeItem('canvasserUserName');
      window.localStorage.removeItem('firstName');
      window.localStorage.removeItem('lastName');
    } catch (err) {
      console.error('Error clearing storage:', err);
    }
  }

  try {
    // Attempt to clear server cookies, but don't block the UI if it's slow
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore network errors
  }

  if (typeof window !== 'undefined') {
    // Use location.href or location.replace to force a full reload and clear any in-memory state
    window.location.href = redirectTo;
  }
}
