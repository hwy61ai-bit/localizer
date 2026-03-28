"use client";

import { useEffect, useState, useRef } from "react";

const VENUES = [
  { date: 'MAR 15', venue: 'The Troubadour', city: 'Los Angeles' },
  { date: 'MAR 18', venue: 'First Avenue', city: 'Minneapolis' },
  { date: 'MAR 21', venue: 'The Fillmore', city: 'San Francisco' },
  { date: 'MAR 24', venue: 'The Metro', city: 'Chicago' },
  { date: 'MAR 27', venue: '9:30 Club', city: 'Washington DC' },
  { date: 'MAR 30', venue: 'Brooklyn Steel', city: 'New York' },
  { date: 'APR 02', venue: 'The Ryman', city: 'Nashville' },
  { date: 'APR 05', venue: "Tipitina's", city: 'New Orleans' },
  { date: 'APR 08', venue: 'Red Rocks', city: 'Morrison' },
  { date: 'APR 11', venue: 'The Anthem', city: 'Washington DC' },
  { date: 'APR 14', venue: 'Terminal 5', city: 'New York' },
  { date: 'APR 17', venue: 'House of Blues', city: 'Boston' },
  { date: 'APR 20', venue: 'The Tabernacle', city: 'Atlanta' },
  { date: 'APR 23', venue: "Stubb's BBQ", city: 'Austin' },
  { date: 'APR 26', venue: 'The Wiltern', city: 'Los Angeles' },
  { date: 'APR 29', venue: 'Crystal Ballroom', city: 'Portland' },
  { date: 'MAY 01', venue: 'Fox Theatre', city: 'Oakland' },
  { date: 'MAY 04', venue: 'The Paramount', city: 'Seattle' },
  { date: 'MAY 07', venue: 'Paradiso', city: 'Amsterdam' },
  { date: 'MAY 10', venue: 'Roundhouse', city: 'London' },
  { date: 'MAY 13', venue: 'Olympia', city: 'Paris' },
  { date: 'MAY 16', venue: 'Zenith', city: 'Munich' },
  { date: 'MAY 19', venue: 'Gothic Theatre', city: 'Denver' },
  { date: 'MAY 22', venue: 'Belly Up', city: 'Solana Beach' },
];

function generateTexture(width: number, height: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, width, height);

  const rowHeight = 32;
  let y = 14;
  let idx = 0;

  while (y < height) {
    const show = VENUES[idx % VENUES.length];

    // Date — gold
    ctx.fillStyle = "#C8A84E";
    ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(show.date, 10, y);

    // Venue — bright white
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillText(show.venue, 80, y);

    // City — gold at 70% opacity
    ctx.fillStyle = "rgba(200,168,78,0.7)";
    ctx.font = "10px system-ui, -apple-system, sans-serif";
    ctx.fillText(show.city, 260, y);

    // Subtle separator
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(10, y + 10);
    ctx.lineTo(width - 10, y + 10);
    ctx.stroke();

    y += rowHeight;
    idx++;
  }

  return canvas.toDataURL();
}

interface HWY61WordmarkProps {
  className?: string;
}

const LETTERS = ["H", "W", "Y", "6", "1", ".", "A", "I"];

// Per-letter spin speeds (seconds per rotation) and scroll speeds
const SPIN_SPEEDS = [0.45, 0.7, 0.55, 0.8, 0.5, 0.35, 0.65, 0.6];
const SCROLL_SPEEDS = [22, 30, 18, 35, 25, 15, 28, 20]; // px/sec
const SCROLL_OFFSETS = [0, 80, 40, 120, 60, 20, 100, 50]; // starting offset

export default function HWY61Wordmark({ className }: HWY61WordmarkProps) {
  const [stopped, setStopped] = useState<Set<number>>(new Set());
  const [mapFaded, setMapFaded] = useState(false);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const scrollRef = useRef(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const [scrollY, setScrollY] = useState(0);

  // Generate texture on mount
  useEffect(() => {
    setBgUrl(generateTexture(400, 3000));
  }, []);

  // Scroll animation
  useEffect(() => {
    if (mapFaded) {
      cancelAnimationFrame(frameRef.current);
      return;
    }
    startTimeRef.current = performance.now();
    function tick() {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      scrollRef.current = elapsed;
      setScrollY(elapsed);
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [mapFaded]);

  // Staggered letter stops: ~120ms apart, starting immediately
  useEffect(() => {
    const staggerMs = 120;
    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i < LETTERS.length; i++) {
      timers.push(
        setTimeout(() => {
          setStopped((prev) => {
            const next = new Set([...prev, i]);
            if (next.size === LETTERS.length) {
              // All stopped — wait 4 seconds of texture scroll, then fade
              setTimeout(() => setMapFaded(true), 4000);
            }
            return next;
          });
        }, 200 + i * staggerMs) // small initial delay + stagger
      );
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={className} style={{ position: "relative", display: "inline-block" }}>
      <div
        aria-label="HWY61.AI"
        style={{
          perspective: "800px",
          fontFamily: "'PragmaticaExtended', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(60px, 10vw, 110px)",
          letterSpacing: "-0.08em",
          textTransform: "uppercase",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        <style>{`
          @keyframes hwy61spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
          }
        `}</style>
        {LETTERS.map((char, i) => {
          const isSpinning = !stopped.has(i);
          const perLetterScroll = SCROLL_OFFSETS[i] + scrollY * SCROLL_SPEEDS[i];

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                position: "relative",
                animation: isSpinning ? `hwy61spin ${SPIN_SPEEDS[i]}s linear infinite` : "none",
                transform: isSpinning ? undefined : "rotateY(0deg)",
                filter: isSpinning ? "blur(1.5px)" : "blur(0px)",
                transition: "transform 0.5s ease-out, filter 0.3s ease-out",
              }}
            >
              {/* Texture layer — clipped to letter shape */}
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: bgUrl ? `url(${bgUrl})` : "none",
                  backgroundSize: "400px 3000px",
                  backgroundPosition: `${i * -40}px ${-perLetterScroll}px`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text" as never,
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  opacity: mapFaded ? 0 : 1,
                  transition: "opacity 1s ease-out",
                  pointerEvents: "none",
                }}
              >
                {char}
              </span>
              {/* Solid layer — fades in */}
              <span
                style={{
                  color: "#1a1a1a",
                  opacity: mapFaded ? 1 : 0,
                  transition: "opacity 1s ease-out",
                }}
              >
                {char}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
