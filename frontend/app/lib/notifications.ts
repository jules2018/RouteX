export function showNotification(title: string, body: string) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
    });
  }
}