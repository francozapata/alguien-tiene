type NotificationState = NotificationPermission | "unsupported";

function safeSetLocalStorage(key: string, value: string) {
  if (typeof globalThis === "undefined") return;
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Ignorar: puede fallar en SSR, navegador privado o permisos bloqueados.
  }
}

function safeRemoveLocalStorage(key: string) {
  if (typeof globalThis === "undefined") return;
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // Ignorar: puede fallar en SSR, navegador privado o permisos bloqueados.
  }
}

function hasNotificationApi() {
  return typeof globalThis !== "undefined" && "Notification" in globalThis;
}

export function getNotificationsState(): NotificationState {
  if (!hasNotificationApi()) return "unsupported";
  return Notification.permission;
}

export async function ensureNotificationsPermission(): Promise<NotificationState> {
  if (!hasNotificationApi()) {
    safeSetLocalStorage("figus_notifications_unavailable", "true");
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    safeSetLocalStorage("figus_notifications_allowed", "true");
    safeRemoveLocalStorage("figus_notifications_denied");
    return "granted";
  }

  if (Notification.permission === "denied") {
    safeSetLocalStorage("figus_notifications_denied", "true");
    return "denied";
  }

  const result = await Notification.requestPermission();

  if (result === "granted") {
    safeSetLocalStorage("figus_notifications_allowed", "true");
    safeRemoveLocalStorage("figus_notifications_denied");
  } else if (result === "denied") {
    safeSetLocalStorage("figus_notifications_denied", "true");
  }

  return result;
}

export function notifyLocalMatch(title: string, body: string) {
  if (!hasNotificationApi()) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "/brand/app-icon.png",
  });
}
