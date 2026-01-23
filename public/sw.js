/**
 * Service Worker for Push Notifications
 * Version: 2026-01-23.01
 * 
 * This file handles push events from the browser's push service.
 * It runs in the background, even when the app is closed.
 * 
 * Key events:
 * - 'push': Received when server sends a push notification
 * - 'notificationclick': User clicks on the notification
 */

// 1. Install Event: Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Activate Event: Claim clients immediately so we can control the page
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle incoming push messages
self.addEventListener('push', function(event) {
  
  if (!event.data) {
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    // Try as text as fallback
    const text = event.data.text();
    data = { title: 'Notification', body: text };
  }
  
  // Notification display options
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',    // App icon
    badge: '/badge-72.png',   // Small monochrome icon for Android
    vibrate: [100, 50, 100],  // Vibration pattern
    tag: data.type || 'default', // Group similar notifications
    renotify: true,           // Notify even if same tag
    requireInteraction: false, // Auto-dismiss on desktop
    data: {
      url: data.url || '/',   // URL to open when clicked
      type: data.type,
    },
    // Action buttons (optional)
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  // Check if icons are likely broken (based on what we saw in logs)
  // If the browser thinks they are broken, it might block the notification.
  // We'll keep them but use a more standard path or let it fail gracefully.
  // Chrome/Edge usually show a generic icon if the specified one fails, 
  // UNLESS the entire registration is considered broken.

  
  
  // Show the notification
  event.waitUntil(
    self.registration.showNotification(data.title || 'Project Hub', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // If user clicked dismiss, do nothing
  if (event.action === 'dismiss') {
    return;
  }
  
  // Get the URL to open
  const targetUrl = event.notification.data?.url || '/';
  
  // Try to focus existing tab or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a tab with our app
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate existing tab to target URL and focus it
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // No existing tab, open new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle push subscription change (when browser refreshes subscription)
self.addEventListener('pushsubscriptionchange', function(event) {
  // The subscription has changed, need to re-subscribe
  // This is handled by the client-side code
});
