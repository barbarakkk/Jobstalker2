(function(){
  try {
    const url = new URL(window.location.href);
    // token may come via hash (#access_token=) or query (?access_token=)
    const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
    const query = url.searchParams;
    const accessToken = hash.get('access_token') || query.get('access_token');
    const expiresIn = parseInt(hash.get('expires_in') || query.get('expires_in') || '86400', 10);

    if (!accessToken) {
      console.error('Auth callback missing access token');
      return;
    }

    const expiry = Date.now() + (isNaN(expiresIn) ? 86400 : expiresIn) * 1000;

    chrome.storage.local.set({
      jobstalker_auth_token: accessToken,
      jobstalker_token_expiry: expiry
    }, async () => {
      try {
        // tell background something changed so UI can update
        await chrome.runtime.sendMessage({ action: 'authCompleted' });
      } catch (e) {}
      // close the tab
      window.close();
    });
  } catch (e) {
    console.error('Auth callback error', e);
  }
})();
