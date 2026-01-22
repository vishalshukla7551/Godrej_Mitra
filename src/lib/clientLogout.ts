function showSessionExpiredToast() {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('session-expired-toast');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'session-expired-toast';
    toastContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
      color: white;
      padding: 24px 32px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      font-size: 16px;
      font-weight: 500;
      z-index: 9999;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toastContainer);
  }

  // Add CSS animation
  if (!document.getElementById('toast-animation-style')) {
    const style = document.createElement('style');
    style.id = 'toast-animation-style';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes progress {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Create toast content with progress bar
  toastContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">⚠️</span>
        <span>Your session expired. Please login again.</span>
      </div>
      <div style="
        height: 3px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
        overflow: hidden;
      ">
        <div style="
          height: 100%;
          background: rgba(255, 255, 255, 0.8);
          animation: progress 3s linear forwards;
        "></div>
      </div>
    </div>
  `;

  toastContainer.style.display = 'block';

  // Remove toast after 3 seconds
  setTimeout(() => {
    if (toastContainer) {
      toastContainer.style.display = 'none';
    }
  }, 3000);
}

export async function clientLogout(redirectTo?: string, showToast: boolean = true) {
  // ✅ If no redirectTo provided, detect role and redirect to appropriate login
  let finalRedirectTo = redirectTo;
  
  if (!finalRedirectTo && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('authUser');
      if (raw) {
        const authUser = JSON.parse(raw) as { role?: string };
        // Redirect to role-specific login
        if (authUser.role === 'CANVASSER') {
          finalRedirectTo = '/login/canvasser';
        } else {
          finalRedirectTo = '/login/role';
        }
      } else {
        finalRedirectTo = '/login/role';
      }
    } catch {
      finalRedirectTo = '/login/canvasser';
    }
  }

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

    // Show session expired toast if requested
    if (showToast) {
      showSessionExpiredToast();
    }
  }

  try {
    // Attempt to clear server cookies, but don't block the UI if it's slow
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore network errors
  }

  if (typeof window !== 'undefined') {
    // Wait for toast to display (3 seconds) if shown, otherwise redirect immediately
    const delay = showToast ? 3000 : 0;
    setTimeout(() => {
      window.location.href = finalRedirectTo || '/login/role';
    }, delay);
  }
}
