"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Cheap gate only. app/api/prelaunch/signup does the real validation —
    // never treat this as the authority on what a valid address is.
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus("error");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/prelaunch/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, website }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      // Network failure, offline, blocked request — all one message to the user.
      setStatus("error");
    }
  }

  const submitting = status === "submitting";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .coming-soon-signup {
              width: 100%;
              max-width: 30rem;
              margin-top: 3rem;
            }
            .coming-soon-signup-heading {
              font-family: 'DM Sans', sans-serif;
              font-size: clamp(0.95rem, 2.5vw, 1.15rem);
              font-weight: 500;
              line-height: 1.4;
              color: #1A1A1A;
              margin: 0 0 1.25rem;
            }
            .coming-soon-signup-row {
              display: flex;
              gap: 0.75rem;
              align-items: stretch;
            }
            .coming-soon-signup-input {
              flex: 1 1 auto;
              min-width: 0;
              font-family: 'DM Sans', sans-serif;
              font-size: 1rem;
              color: #1A1A1A;
              background: #FFFDF8;
              border: 3px solid #1A1A1A;
              border-radius: 0;
              padding: 0.85rem 1rem;
              appearance: none;
            }
            .coming-soon-signup-input::placeholder {
              color: #6B6661;
            }
            .coming-soon-signup-input:focus-visible {
              outline: 3px solid #c5535b;
              outline-offset: 2px;
            }
            .coming-soon-signup-input:disabled {
              opacity: 0.55;
            }
            .coming-soon-signup-button {
              flex: 0 0 auto;
              font-family: 'Bebas Neue', sans-serif;
              font-size: 1.05rem;
              letter-spacing: 0.18em;
              color: #F5F0E8;
              background: #1A1A1A;
              border: 3px solid #1A1A1A;
              border-radius: 0;
              box-shadow: 4px 4px 0 #c5535b;
              padding: 0.85rem 1.5rem;
              cursor: pointer;
              transition: transform 120ms ease, box-shadow 120ms ease;
            }
            .coming-soon-signup-button:hover:not(:disabled) {
              transform: translate(-2px, -2px);
              box-shadow: 6px 6px 0 #c5535b;
            }
            .coming-soon-signup-button:active:not(:disabled) {
              transform: translate(2px, 2px);
              box-shadow: 2px 2px 0 #c5535b;
            }
            .coming-soon-signup-button:focus-visible {
              outline: 3px solid #c5535b;
              outline-offset: 3px;
            }
            .coming-soon-signup-button:disabled {
              opacity: 0.55;
              cursor: not-allowed;
              box-shadow: 4px 4px 0 #c5535b;
            }
            .coming-soon-signup-error {
              font-family: 'DM Sans', sans-serif;
              font-size: 0.85rem;
              color: #c5535b;
              margin: 0.75rem 0 0;
              text-align: left;
            }
            .coming-soon-signup-success {
              font-family: 'DM Sans', sans-serif;
              font-size: clamp(0.95rem, 2.5vw, 1.15rem);
              font-weight: 500;
              color: #1A1A1A;
              border-left: 3px solid #c5535b;
              padding-left: 1rem;
              margin: 0;
              text-align: left;
            }
            /* Honeypot. Off-screen rather than display:none — bots skip fields
               that are display:none or hidden, which defeats the trap. */
            .coming-soon-signup-hp {
              position: absolute;
              left: -9999px;
              top: auto;
              width: 1px;
              height: 1px;
              overflow: hidden;
            }
            @media (max-width: 520px) {
              .coming-soon-signup-row {
                flex-direction: column;
              }
            }
          `,
        }}
      />
      <div className="coming-soon-signup">
        {/* PLACEHOLDER COPY — flagged for Tim's approval. Both the heading below
            and the "NOTIFY ME" button label are stand-ins, not final wording. */}
        <h2 className="coming-soon-signup-heading">
          Be first to know when Localizer launches.
        </h2>

        {status === "success" ? (
          <p className="coming-soon-signup-success" role="status">
            You&apos;re on the list.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="coming-soon-signup-row">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Clear a stale error the moment they start fixing it.
                  if (status === "error") setStatus("idle");
                }}
                placeholder="you@email.com"
                aria-label="Email address"
                autoComplete="email"
                disabled={submitting}
                className="coming-soon-signup-input"
              />

              {/* Honeypot: hidden from humans, irresistible to bots. A non-empty
                  value makes the server discard the signup and still return 200. */}
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="coming-soon-signup-hp"
                aria-hidden="true"
                tabIndex={-1}
                autoComplete="off"
              />

              <button
                type="submit"
                disabled={submitting}
                className="coming-soon-signup-button"
              >
                {submitting ? "SENDING…" : "NOTIFY ME"}
              </button>
            </div>

            {status === "error" && (
              <p className="coming-soon-signup-error" role="status">
                Something went wrong — try again.
              </p>
            )}
          </form>
        )}
      </div>
    </>
  );
}
