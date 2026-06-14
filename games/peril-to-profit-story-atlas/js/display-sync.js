
(function () {
  const CHANNEL_NAME = "goldspire-run-sync";
  const STORAGE_KEY = "goldspire-run-sync-message-v1";
  const PROTOCOL = "goldspire-run-sync-v1";
  let channel = null;
  try {
    if ("BroadcastChannel" in window) channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    channel = null;
  }

  function normalize(message) {
    return {
      protocol: PROTOCOL,
      type: message.type,
      slideId: message.slideId || null,
      payload: message.payload || {},
      sentAt: Date.now(),
      source: message.source || "unknown",
    };
  }

  function send(message) {
    const normalized = normalize(message || {});
    if (channel) channel.postMessage(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {}
    return normalized;
  }

  function listen(callback) {
    if (channel) {
      channel.addEventListener("message", (event) => {
        if (event.data && event.data.protocol === PROTOCOL) callback(event.data);
      });
    }
    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const message = JSON.parse(event.newValue);
        if (message.protocol === PROTOCOL) callback(message);
      } catch {}
    });
  }

  function lastMessage() {
    try {
      const message = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return message && message.protocol === PROTOCOL ? message : null;
    } catch {
      return null;
    }
  }

  window.GoldspireDisplaySync = { send, listen, lastMessage, PROTOCOL, STORAGE_KEY, CHANNEL_NAME };
})();
