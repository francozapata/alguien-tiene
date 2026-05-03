export function getNotificationsState() {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function ensureNotificationsPermission() {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) {
    window.localStorage.setItem("figus_notifications_unavailable", "true");
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    window.localStorage.setItem("figus_notifications_allowed", "true");
    window.localStorage.removeItem("figus_notifications_denied");
    return "granted";
  }

  if (Notification.permission === "denied") {
    window.localStorage.setItem("figus_notifications_denied", "true");
    return "denied";
  }

  const result = await Notification.requestPermission();
  if (result === "granted") {
    window.localStorage.setItem("figus_notifications_allowed", "true");
    window.localStorage.removeItem("figus_notifications_denied");
  } else if (result === "denied") {
    window.localStorage.setItem("figus_notifications_denied", "true");
  }

  return result;
}

export function notifyLocalMatch(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "/brand/app-icon.png",
  });
}
