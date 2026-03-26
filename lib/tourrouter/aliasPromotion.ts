import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Promote account-level aliases to global scope when confirmed by 3+ different orgs.
 * This should be called periodically (manually or via cron).
 */
export async function promoteAliases(): Promise<{ promoted: number }> {
  const supabase = await supabaseServer();
  let promoted = 0;

  // Find account-level aliases grouped by normalized header + field
  // that have been confirmed across 3+ different orgs
  const { data: candidates } = await supabase
    .from("field_aliases")
    .select("raw_header, tourrouter_field, org_id, confirmed_count")
    .eq("scope", "account");

  if (!candidates || candidates.length === 0) return { promoted: 0 };

  // Group by (raw_header, tourrouter_field) → count distinct org_ids
  const groups = new Map<string, { header: string; field: string; orgIds: Set<string>; totalCount: number }>();

  for (const alias of candidates) {
    const key = `${alias.raw_header}::${alias.tourrouter_field}`;
    if (!groups.has(key)) {
      groups.set(key, {
        header: alias.raw_header,
        field: alias.tourrouter_field,
        orgIds: new Set(),
        totalCount: 0,
      });
    }
    const group = groups.get(key)!;
    if (alias.org_id) group.orgIds.add(alias.org_id);
    group.totalCount += alias.confirmed_count || 1;
  }

  // Promote aliases confirmed by 3+ distinct orgs
  for (const [, group] of groups) {
    if (group.orgIds.size < 3) continue;

    // Check if global alias already exists
    const { data: existing } = await supabase
      .from("field_aliases")
      .select("id")
      .eq("raw_header", group.header)
      .eq("tourrouter_field", group.field)
      .eq("scope", "global")
      .maybeSingle();

    if (!existing) {
      await supabase.from("field_aliases").insert({
        scope: "global",
        org_id: null,
        agency_name: null,
        raw_header: group.header,
        tourrouter_field: group.field,
        confirmed_count: group.totalCount,
      });
      promoted++;
    } else {
      // Update count
      await supabase
        .from("field_aliases")
        .update({ confirmed_count: group.totalCount, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
  }

  return { promoted };
}
