import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import ArtistTile from "./ArtistTile";

export default async function ArtistsDashboardPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).maybeSingle();
  let orgId = membership?.org_id as string | undefined;
  if (!orgId) {
    const newOrgId = randomUUID();
    await supabase.from("orgs").insert({ id: newOrgId, name: "My Workspace" });
    orgId = newOrgId;
    await supabase.from("org_members").insert({ org_id: orgId, user_id: user.id, role: "owner" });
    await supabase.from("orgs").update({ owner_email: user.email }).eq("id", orgId);
  }

  const { data: artistsData } = await supabase.from("artists").select("id, name, image_url, created_at").eq("org_id", orgId).order("created_at", { ascending: false });
  const artists = artistsData ?? [];

  const tourCounts: Record<string, number> = {};
  if (artists.length > 0) {
    const { data: tours } = await supabase.from("tours").select("artist_id").in("artist_id", artists.map((a) => a.id));
    for (const tour of tours ?? []) {
      if (tour.artist_id) tourCounts[tour.artist_id] = (tourCounts[tour.artist_id] ?? 0) + 1;
    }
  }

  async function createArtist() {
    "use server";
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: membership } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).maybeSingle();
    if (!membership?.org_id) redirect("/dashboard");
    const newId = randomUUID();
    await supabase.from("artists").insert({ id: newId, org_id: membership.org_id, name: "New Artist" });
    redirect(`/dashboard/artists/${newId}`);
  }

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8, borderBottom: "2px solid var(--hw-border-strong)" }}>LOCALIZER</h1>
            <h2 className="brand-title" style={{ margin: 0, marginBottom: 6, fontSize: "400%" }}>ARTISTS</h2>
            <div style={{ fontSize: 13, color: "var(--hw-text-muted)" }}>{artists.length} artist{artists.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ fontSize: 12, color: "var(--hw-text-muted)" }}>{user.email}</div>
            <a href="/dashboard" style={{ padding: "8px 16px", borderRadius: 0, border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", textDecoration: "none", fontFamily: "var(--hw-font-display)", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 3 }}>TourRouter &rarr;</a>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {artists.map((artist) => (
            <ArtistTile key={artist.id} artistId={artist.id} artistName={artist.name} tourCount={tourCounts[artist.id] ?? 0} imageUrl={artist.image_url ?? null} />
          ))}
          <form action={createArtist}>
            <button type="submit" style={{ width: "100%", aspectRatio: "1 / 1", background: "transparent", border: "3px dashed var(--hw-border)", borderRadius: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", padding: 20 }}>
              <span style={{ fontSize: 140, fontWeight: 900, color: "var(--hw-text)", lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 13, fontFamily: "var(--hw-font-display)", fontWeight: 700, color: "var(--hw-text-muted)", letterSpacing: 3, textTransform: "uppercase" }}>New Artist</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
