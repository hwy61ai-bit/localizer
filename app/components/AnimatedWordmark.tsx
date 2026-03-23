"use client";

import { useEffect, useState, useRef } from "react";

function generateTourSchedule(width: number, height: number): string {
  const canvas = document.createElement("canvas");
  // Make it tall so we can scroll
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, width, height);

  const schedule = [
    { date: "JAN 14", day: "FRI", venue: "The Troubadour", city: "Los Angeles, CA" },
    { date: "JAN 24", day: "MON", venue: "First Avenue", city: "Minneapolis, MN" },
    { date: "JAN 15", day: "SAT", venue: "The Fillmore", city: "San Francisco, CA" },
    { date: "JAN 26", day: "WED", venue: "The Metro", city: "Chicago, IL" },
    { date: "FEB 4",  day: "FRI", venue: "The Troubadour", city: "Los Angeles, CA" },
    { date: "FEB 12", day: "SAT", venue: "First Avenue", city: "Minneapolis, MN" },
    { date: "FEB 18", day: "FRI", venue: "The Fillmore", city: "San Francisco, CA" },
    { date: "FEB 26", day: "SAT", venue: "The Metro", city: "Chicago, IL" },
    { date: "MAR 5",  day: "SAT", venue: "The Troubadour", city: "Los Angeles, CA" },
    { date: "MAR 11", day: "FRI", venue: "First Avenue", city: "Minneapolis, MN" },
    { date: "MAR 19", day: "SAT", venue: "The Fillmore", city: "San Francisco, CA" },
    { date: "MAR 26", day: "SAT", venue: "The Metro", city: "Chicago, IL" },
  ];

  const rowHeight = 28;
  // Repeat schedule to fill height
  let y = 12;
  let idx = 0;
  while (y < height) {
    const show = schedule[idx % schedule.length];
    
    // Date — yellow/gold
    ctx.fillStyle = "rgba(220,180,60,0.9)";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(show.date, 12, y);

    // Day — dim
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "10px monospace";
    ctx.fillText(show.day, 80, y);

    // Venue — bright white, bold
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 12px monospace";
    ctx.fillText(show.venue, 120, y);

    // City — dim gray
    ctx.fillStyle = "rgba(220,180,60,0.7)";
    ctx.font = "10px monospace";
    ctx.fillText(show.city, 340, y);

    // Subtle separator line
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(12, y + 8);
    ctx.lineTo(width - 12, y + 8);
    ctx.stroke();

    y += rowHeight;
    idx++;
  }

  return canvas.toDataURL();
}

export default function AnimatedWordmark() {
  const text = "Localizer.";
  const [stopped, setStopped] = useState<Set<number>>(new Set());
  const [allStopped, setAllStopped] = useState(false);
  const [mapFaded, setMapFaded] = useState(false);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const scrollRef = useRef(0);
  const frameRef = useRef<number>(0);
  const [scrollY, setScrollY] = useState(0);

  const speeds = [0.4, 0.7, 0.55, 0.85, 0.45, 0.65, 0.5, 0.75, 0.6, 0.9];

  useEffect(() => {
    setBgUrl(generateTourSchedule(500, 2000));
  }, []);

  // Scroll the background upward
  useEffect(() => {
    if (mapFaded) {
      cancelAnimationFrame(frameRef.current);
      return;
    }
    function tick() {
      scrollRef.current += 0.4;
      if (scrollRef.current > 1200) scrollRef.current = 0;
      setScrollY(scrollRef.current);
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [mapFaded]);

  useEffect(() => {
    const total = text.length;
    const staggerMs = 1000 / total;

    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < total; i++) {
      timers.push(
        setTimeout(() => {
          setStopped(prev => {
            const next = new Set([...prev, i]);
            if (next.size === total) {
              setAllStopped(true);
              setTimeout(() => setMapFaded(true), 2000);
            }
            return next;
          });
        }, i * staggerMs)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div className="hero-wordmark" aria-label={text} style={{ perspective: "800px" }}>
        <style>{`
          @keyframes ySpin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
          }
        `}</style>
        {text.split("").map((char, i) => {
          const isSpinning = !stopped.has(i);

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                position: "relative",
                animation: isSpinning ? `ySpin ${speeds[i]}s linear infinite` : "none",
                transform: isSpinning ? undefined : "rotateY(0deg)",
                filter: isSpinning ? "blur(1.5px)" : "blur(0px)",
                transition: "transform 0.5s ease-out, filter 0.3s ease-out",
              }}
            >
              <span style={{
                position: "absolute",
                inset: 0,
                backgroundImage: bgUrl ? `url(${bgUrl})` : "none",
                backgroundSize: "500px 2000px",
                backgroundPosition: `${i * -45}px ${-scrollY}px`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text" as any,
                WebkitTextFillColor: "transparent",
                color: "transparent",
                opacity: mapFaded ? 0 : 1,
                transition: "opacity 1s ease-out",
                pointerEvents: "none",
              }}>{char}</span>
              <span style={{
                color: "#f0ede8",
                opacity: mapFaded ? 1 : 0,
                transition: "opacity 1s ease-out",
              }}>{char}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
