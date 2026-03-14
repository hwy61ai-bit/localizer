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

  const { data: artistsData, error: artistsError } = await supabase
    .from("artists")
    .select("id, name, image_url, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (artistsError) throw new Error(artistsError.message);
  const artists = artistsData ?? [];

  const tourCounts: { [key: string]: number } = {};

  if (artists.length > 0) {
    const { data: tourData } = await supabase
      .from("tours")
      .select("id, artist_id")
      .in("artist_id", artists.map((a) => a.id));

    for (const artist of artists) {
      tourCounts[artist.id] = (tourData ?? []).filter((t) => t.artist_id === artist.id).length;
    }
  }


  async function createArtist() {
    "use server";
    const supabase = await supabaseServer();
    const newArtistId = randomUUID();
    const { error } = await supabase.from("artists").insert({
      id: newArtistId,
      org_id: orgId,
      name: "New Artist",
    });
    if (error) throw new Error(error.message);
    redirect(`/dashboard/artists/${newArtistId}`);
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

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, position: "relative" }}>
          <div>
            <div style={{ position: "absolute", top: 0, right: 0 }}><a href="/account" style={{ fontSize: 13, fontWeight: 700, color: "#fff", textDecoration: "none", background: "#111", padding: "8px 16px", borderRadius: 999 }}>Account</a></div><h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8, borderBottom: "2px solid #111111" }}>LOCALIZER</h1>
            <h2 className="brand-title" style={{ margin: 0, marginBottom: 6, fontSize: "400%" }}>ARTISTS</h2>
            <div style={{ fontSize: 13, color: "#888" }}>
              {artists.length} artist{artists.length !== 1 ? "s" : ""}
            </div>
          </div>

        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>

          {artists.map((artist) => {
            const dateRange: string | null = null;

            return (
              <TourTile
                key={artist.id}
                tourId={artist.id}
                tourName={artist.name ?? "Untitled Artist"}
                bandName={artist.name ?? null}
                dateRange={dateRange}
                eventCount={tourCounts[artist.id] ?? 0}
                imageUrl={artist.image_url ?? null}
                href={`/dashboard/artists/${artist.id}`}
                type="artist"
              />
            );
          })}

          <form action={createArtist}>
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
              <span style={{ fontSize: 13, fontWeight: 700, color: "#aaa", letterSpacing: "0.04em" }}>New Artist</span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
