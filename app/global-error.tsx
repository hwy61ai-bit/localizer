"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ padding: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 900 }}>Global error</h1>
        <pre style={{ marginTop: 12, opacity: 0.7, whiteSpace: "pre-wrap" }}>
          {error?.message}
        </pre>
        <button
          onClick={reset}
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}