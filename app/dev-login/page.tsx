export default function DevLoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h1>Dev Login</h1>
      <p style={{ opacity: 0.7 }}>
        Temporary page while magic-link email is rate-limited.
      </p>

      {searchParams?.error ? (
        <p style={{ color: "crimson" }}>{searchParams.error}</p>
      ) : null}

      <form
        action="/auth/password"
        method="post"
        style={{ marginTop: 16, display: "grid", gap: 12 }}
      >
        <input name="email" placeholder="email" style={{ padding: 10 }} />
        <input
          name="password"
          placeholder="password"
          type="password"
          style={{ padding: 10 }}
        />
        <button style={{ padding: 10 }}>Sign in</button>
      </form>

      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        Remove <code>/dev-login</code> before launch.
      </p>
    </div>
  );
}