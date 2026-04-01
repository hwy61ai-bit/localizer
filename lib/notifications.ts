import type { SupabaseClient } from "@supabase/supabase-js";

interface CreateNotificationParams {
  supabase: SupabaseClient;
  orgId: string;
  userId?: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
}

export async function createNotification({
  supabase,
  orgId,
  userId,
  type,
  title,
  body = null,
  link = null,
}: CreateNotificationParams): Promise<void> {
  try {
    let userIds: string[];

    if (userId) {
      userIds = [userId];
    } else {
      const { data: members, error } = await supabase
        .from("org_members")
        .select("user_id")
        .eq("org_id", orgId);
      if (error || !members || members.length === 0) {
        console.error("[notifications] Failed to fetch org_members:", error?.message);
        return;
      }
      userIds = members.map((m) => m.user_id);
    }

    const rows = userIds.map((uid) => ({
      org_id: orgId,
      user_id: uid,
      type,
      title,
      body,
      link,
      read: false,
    }));

    const { error } = await supabase.from("notifications").insert(rows);
    if (error) {
      console.error("[notifications] Insert error:", error.message);
    }
  } catch (e) {
    console.error("[notifications] Unexpected error:", e);
  }
}
