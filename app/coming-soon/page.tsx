import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HWY61 LABS",
  description: "Something is coming.",
};

export default function ComingSoonPage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .coming-soon-wrap {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: transparent;
              text-align: center;
              padding: 2rem;
            }
            .coming-soon-wordmark {
              font-family: 'Bebas Neue', sans-serif;
              font-size: clamp(4rem, 12vw, 8rem);
              line-height: 1;
              letter-spacing: 0.04em;
              color: #111;
              margin: 0;
            }
            .coming-soon-wordmark .crimson {
              color: #c5535b;
            }
            .coming-soon-tagline {
              font-family: 'Space Mono', monospace;
              font-size: clamp(0.7rem, 2vw, 0.95rem);
              text-transform: uppercase;
              letter-spacing: 0.35em;
              color: #111;
              margin-top: 1.5rem;
            }
            .coming-soon-login {
              font-family: 'DM Sans', sans-serif;
              font-size: 0.8rem;
              color: #c5535b;
              text-decoration: none;
              margin-top: 3rem;
              border-radius: 0;
            }
            .coming-soon-login:hover {
              text-decoration: underline;
            }
          `,
        }}
      />
      <div className="coming-soon-wrap">
        <h1 className="coming-soon-wordmark">
          HWY<span className="crimson">6</span><span className="crimson">1</span> LABS
        </h1>
        <p className="coming-soon-tagline">Something is coming</p>
        <a href="/login" className="coming-soon-login">
          Team Login →
        </a>
      </div>
    </>
  );
}
