/* ===== Service Worker for Note App Reminders ===== */

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(self.clients.claim());
});

/**
 * Handle incoming push events (optional if backend sends push messages)
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || "Note Reminder";
  const body = data.body || "You have a reminder!";
  const options = {
    body,
    tag: "noteapp-reminder",
    renotify: true,
    icon: "/icons/notification-icon.png", // optional
    badge: "/icons/notification-badge.png", // optional
    data: {
      url: data.url || "/", // open this when clicked
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Handle notification click
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Focus if already open, or open new tab
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        const urlToOpen = event.notification.data?.url || "/";
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * Optional: show notifications triggered locally by the app (no push)
 */
self.addEventListener("message", (event) => {
  const { title, body } = event.data || {};
  if (title && body) {
    self.registration.showNotification(title, {
      body,
      tag: "noteapp-reminder",
      renotify: true,
    });
  }
});
