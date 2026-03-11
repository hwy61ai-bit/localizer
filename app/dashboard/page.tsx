import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import TourTile from "./TourTile";

type TourStat = {
  count: number;
  minDate: string | null;
  maxDate: string | null;
};

export default async function DashboardPage() {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  let orgId = membership?.org_id as string | undefined;

  if (!orgId) {
    const newOrgId = randomUUID();
    const { error: orgError } = await supabase
      .from("orgs")
      .insert({ id: newOrgId, name: "My Workspace" });
    if (orgError) throw new Error(orgError.message);
    orgId = newOrgId;
    const { error: memberError } = await supabase.from("org_members").insert({
      org_id: orgId,
      user_id: user.id,
      role: "owner",
    });
    if (memberError) throw new Error(memberError.message);
    await supabase
      .from("orgs")
      .update({ owner_email: user.email })
      .eq("id", orgId);
  }

  const { data: toursData, error: toursError } = await supabase
    .from("tours")
    .select("id, name, band_tour_label, image_url, created_at, last_opened_at")
    .eq("org_id", orgId)
    .order("last_opened_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (toursError) throw new Error(toursError.message);
  const tours = toursData ?? [];

  const tourStats: { [key: string]: TourStat } = {};

  if (tours.length > 0) {
    const { data: eventStats } = await supabase
      .from("events")
      .select("tour_id, date_iso")
      .in("tour_id", tours.map((t) => t.id))
      .not("date_iso", "is", null);

    for (const tour of tours) {
      const rows = (eventStats ?? []).filter((e) => e.tour_id === tour.id);
      const dates = rows.map((e) => e.date_iso as string).filter(Boolean).sort();
      tourStats[tour.id] = {
        count: rows.length,
        minDate: dates.length > 0 ? dates[0] : null,
        maxDate: dates.length > 0 ? dates[dates.length - 1] : null,
      };
    }
  }

  async function createTour() {
    "use server";
    const supabase = await supabaseServer();
    const newTourId = randomUUID();
    const { error } = await supabase.from("tours").insert({
      id: newTourId,
      org_id: orgId,
      name: "New Tour",
    });
    if (error) throw new Error(error.message);
    redirect(`/dashboard/tours/${newTourId}`);
  }

  function formatDate(iso: string | null): string | null {
    if (!iso) return null;
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#EEEEEE", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 className="brand-title" style={{ margin: 0, marginBottom: 4 }}>LOCALIZER</h1>
            <div style={{ fontSize: 13, color: "#888" }}>
              {tours.length} tour{tours.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#aaa" }}>{user.email}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>

          {tours.map((tour) => {
            const stats: TourStat = tourStats[tour.id] ?? { count: 0, minDate: null, maxDate: null };
            const bandName: string | null = tour.band_tour_label ?? null;
            const tourName: string = tour.name ?? "Untitled Tour";
            const minFmt = formatDate(stats.minDate);
            const maxFmt = formatDate(stats.maxDate);
            let dateRange: string | null = null;
            if (minFmt && maxFmt && minFmt !== maxFmt) {
              dateRange = `${minFmt} – ${maxFmt}`;
            } else if (minFmt) {
              dateRange = minFmt;
            }

            return (
              <TourTile
                key={tour.id}
                tourId={tour.id}
                tourName={tourName}
                bandName={bandName}
                dateRange={dateRange}
                eventCount={stats.count}
                imageUrl={tour.image_url ?? null}
              />
            );
          })}

          <form action={createTour}>
            <button type="submit" style={{
              width: "100%",
              aspectRatio: "1 / 1",
              background: "transparent",
              border: "1.5px dashed #CCCCCC",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              padding: 20,
            }}>
              <span style={{ fontSize: 140, fontWeight: 900, color: "#111", lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#aaa", letterSpacing: "0.04em" }}>New Tour</span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
