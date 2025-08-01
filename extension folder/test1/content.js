function hasSupabaseSession() {
    var primary = localStorage.getItem("supabase.auth.token");
    if (primary) {
      try {
        var session = JSON.parse(primary);
        if (session && session.access_token) {
          return true;
        }
      } catch (e) {
        // ignore malformed
      }
    }
  
    var keys = Object.keys(localStorage);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if ((k.indexOf("sb-") === 0 || k.toLowerCase().indexOf("supabase") !== -1) && localStorage.getItem(k)) {
        return true;
      }
    }
  
    if (localStorage.getItem("jobstalker_force_signed_in") === "1") {
      return true;
    }
  
    return false;
  }
  
  function isSignedIn() {
    return hasSupabaseSession();
  }
  
  var lastState = null;
  
  function pushStatusToBackground() {
    var signedIn = isSignedIn();
    var override = localStorage.getItem("jobstalker_force_signed_in") === "1";
    if (signedIn === lastState && !override) {
      return;
    }
    lastState = signedIn;
  
    chrome.runtime.sendMessage(
      {
        type: "STATUS_UPDATE",
        signedIn: signedIn,
        override: override,
        timestamp: Date.now()
      },
      function (resp) {
        // ack
      }
    );
  }
  
  var observer = new MutationObserver(pushStatusToBackground);
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(pushStatusToBackground, 2000);
  window.addEventListener("storage", pushStatusToBackground);
  pushStatusToBackground();
  
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (!msg) return;
    if (msg.type === "TOGGLE_OVERRIDE") {
      if (localStorage.getItem("jobstalker_force_signed_in") === "1") {
        localStorage.removeItem("jobstalker_force_signed_in");
      } else {
        localStorage.setItem("jobstalker_force_signed_in", "1");
      }
      pushStatusToBackground();
      sendResponse({
        signedIn: isSignedIn(),
        override: localStorage.getItem("jobstalker_force_signed_in") === "1"
      });
    } else if (msg.type === "GET_STATUS") {
      sendResponse({
        signedIn: isSignedIn(),
        override: localStorage.getItem("jobstalker_force_signed_in") === "1"
      });
    }
  });
  function hasSupabaseSession() {
    var primary = localStorage.getItem("supabase.auth.token");
    if (primary) {
      try {
        var session = JSON.parse(primary);
        if (session && session.access_token) {
          return true;
        }
      } catch (e) {
        // ignore malformed
      }
    }
  
    var keys = Object.keys(localStorage);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if ((k.indexOf("sb-") === 0 || k.toLowerCase().indexOf("supabase") !== -1) && localStorage.getItem(k)) {
        return true;
      }
    }
  
    if (localStorage.getItem("jobstalker_force_signed_in") === "1") {
      return true;
    }
  
    return false;
  }
  
  function isSignedIn() {
    return hasSupabaseSession();
  }
  
  var lastState = null;
  
  function pushStatusToBackground() {
    var signedIn = isSignedIn();
    var override = localStorage.getItem("jobstalker_force_signed_in") === "1";
    if (signedIn === lastState && !override) {
      return;
    }
    lastState = signedIn;
  
    chrome.runtime.sendMessage(
      {
        type: "STATUS_UPDATE",
        signedIn: signedIn,
        override: override,
        timestamp: Date.now()
      },
      function (resp) {
        // ack
      }
    );
  }
  
  var observer = new MutationObserver(pushStatusToBackground);
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(pushStatusToBackground, 2000);
  window.addEventListener("storage", pushStatusToBackground);
  pushStatusToBackground();
  
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (!msg) return;
    if (msg.type === "TOGGLE_OVERRIDE") {
      if (localStorage.getItem("jobstalker_force_signed_in") === "1") {
        localStorage.removeItem("jobstalker_force_signed_in");
      } else {
        localStorage.setItem("jobstalker_force_signed_in", "1");
      }
      pushStatusToBackground();
      sendResponse({
        signedIn: isSignedIn(),
        override: localStorage.getItem("jobstalker_force_signed_in") === "1"
      });
    } else if (msg.type === "GET_STATUS") {
      sendResponse({
        signedIn: isSignedIn(),
        override: localStorage.getItem("jobstalker_force_signed_in") === "1"
      });
    }
  });
  function hasSupabaseSession() {
    var primary = localStorage.getItem("supabase.auth.token");
    if (primary) {
      try {
        var session = JSON.parse(primary);
        if (session && session.access_token) {
          return true;
        }
      } catch (e) {
        // ignore malformed
      }
    }
  
    var keys = Object.keys(localStorage);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if ((k.indexOf("sb-") === 0 || k.toLowerCase().indexOf("supabase") !== -1) && localStorage.getItem(k)) {
        return true;
      }
    }
  
    if (localStorage.getItem("jobstalker_force_signed_in") === "1") {
      return true;
    }
  
    return false;
  }
  
  function isSignedIn() {
    return hasSupabaseSession();
  }
  
  var lastState = null;
  
  function pushStatusToBackground() {
    var signedIn = isSignedIn();
    var override = localStorage.getItem("jobstalker_force_signed_in") === "1";
    if (signedIn === lastState && !override) {
      return;
    }
    lastState = signedIn;
  
    chrome.runtime.sendMessage(
      {
        type: "STATUS_UPDATE",
        signedIn: signedIn,
        override: override,
        timestamp: Date.now()
      },
      function (resp) {
        // ack
      }
    );
  }
  
  var observer = new MutationObserver(pushStatusToBackground);
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(pushStatusToBackground, 2000);
  window.addEventListener("storage", pushStatusToBackground);
  pushStatusToBackground();
  
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (!msg) return;
    if (msg.type === "TOGGLE_OVERRIDE") {
      if (localStorage.getItem("jobstalker_force_signed_in") === "1") {
        localStorage.removeItem("jobstalker_force_signed_in");
      } else {
        localStorage.setItem("jobstalker_force_signed_in", "1");
      }
      pushStatusToBackground();
      sendResponse({
        signedIn: isSignedIn(),
        override: localStorage.getItem("jobstalker_force_signed_in") === "1"
      });
    } else if (msg.type === "GET_STATUS") {
      sendResponse({
        signedIn: isSignedIn(),
        override: localStorage.getItem("jobstalker_force_signed_in") === "1"
      });
    }
  });
      