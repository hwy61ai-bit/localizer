import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const hasEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold">Localizer</h1>
        <p className="mt-4 text-lg text-gray-400">
          Supabase env loaded: {hasEnv ? "YES" : "NO"}
        </p>
      </div>
    </main>
  );
}