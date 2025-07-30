// Check auth state on load
console.log('Auth content script loaded');
window.authCheck.checkAuthState();

// Check auth state periodically
setInterval(() => window.authCheck.checkAuthState(), 5000);

// Also check when storage changes
window.addEventListener('storage', (event) => {
  if (event.key?.startsWith('sb-')) {
    console.log('Auth storage changed');
    window.authCheck.checkAuthState();
  }
}); 