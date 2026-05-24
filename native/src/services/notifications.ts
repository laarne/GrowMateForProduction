import { supabase } from "./supabase";

export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "order_placed"
  | "order_paid"
  | "order_completed"
  | "order_cancelled"
  | "message"
  | "review"
  | "system";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  referenceId: string | null;
  createdAt: string;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
};

export async function getNotifications(userId: string): Promise<Notification[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, body, is_read, reference_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    // Table may not exist yet — return empty gracefully
    console.warn("[notifications] getNotifications failed:", error.message);
    return [];
  }

  return ((data ?? []) as NotificationRow[]).map((n) => ({
    id: n.id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.is_read,
    referenceId: n.reference_id,
    createdAt: n.created_at,
  }));
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}
