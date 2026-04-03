"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 48,
        background: "var(--hw-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--hw-bg-surface)",
          border: "3px solid var(--hw-border-strong)",
          borderRadius: 0,
          padding: 48,
          maxWidth: 520,
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontFamily: "var(--hw-font-display)",
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "var(--hw-text)",
          }}
        >
          Something went wrong
        </h1>
        <pre
          style={{
            marginTop: 16,
            fontFamily: "var(--hw-font-mono)",
            fontSize: 13,
            color: "var(--hw-text-muted)",
            whiteSpace: "pre-wrap",
          }}
        >
          {error?.message}
        </pre>
        <button
          onClick={reset}
          style={{
            marginTop: 24,
            padding: "12px 24px",
            borderRadius: 0,
            border: "3px solid var(--hw-crimson)",
            background: "var(--hw-crimson)",
            color: "var(--hw-bg-surface)",
            fontFamily: "var(--hw-font-display)",
            fontSize: 16,
            textTransform: "uppercase",
            letterSpacing: 3,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}