import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import ArtistDetailClient from "./ArtistDetailClient";

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <ArtistDetailClient artistId={artistId} />;
}