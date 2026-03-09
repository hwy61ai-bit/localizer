"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  tourId: string;
  tourName: string;
  bandName: string | null;
  dateRange: string | null;
  eventCount: number;
  imageUrl: string | null;
};

export default function TourTile({
  tourId,
  tourName,
  bandName,
  dateRange,
  eventCount,
  imageUrl,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(imageUrl);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `tour-images/${tourId}.${ext}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("localizer-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("localizer-assets")
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      // Save to tours table
      const { error: updateError } = await supabase
        .from("tours")
        .update({ image_url: publicUrl })
        .eq("id", tourId);

      if (updateError) throw updateError;

      setCurrentImage(publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div
      style={{ position: "relative", cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleUpload}
      />

      {/* Tile */}
      <div
        onClick={() => router.push(`/dashboard/tours/${tourId}`)}
        style={{
          background: currentImage ? "transparent" : "#fff",
          border: "1px solid #DDDDDD",
          borderRadius: 14,
          padding: 20,
          minHeight: 148,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          position: "relative",
          boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.09)" : "none",
          transform: hovered ? "translateY(-2px)" : "none",
          transition: "box-shadow 0.15s, transform 0.15s",
        }}
      >
        {/* Background image */}
        {currentImage && (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${currentImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* Dark overlay for readability */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)",
              }}
            />
          </>
        )}

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {bandName && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: currentImage ? "rgba(255,255,255,0.7)" : "#999",
                marginBottom: 6,
              }}
            >
              {bandName}
            </div>
          )}
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: currentImage ? "#fff" : "#111",
              lineHeight: 1.2,
              letterSpacing: -0.3,
            }}
          >
            {tourName}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {dateRange && (
            <div
              style={{
                fontSize: 12,
                color: currentImage ? "rgba(255,255,255,0.7)" : "#666",
                marginBottom: 8,
              }}
            >
              {dateRange}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: currentImage ? "rgba(255,255,255,0.6)" : "#aaa",
              }}
            >
              {eventCount} event{eventCount !== 1 ? "s" : ""}
            </span>
            <span style={{ fontSize: 16, color: currentImage ? "rgba(255,255,255,0.5)" : "#ccc" }}>→</span>
          </div>
        </div>
      </div>

      {/* Upload button — appears on hover */}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            fileRef.current?.click();
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            padding: "5px 10px",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            letterSpacing: "0.04em",
          }}
        >
          {uploading ? "Uploading…" : currentImage ? "Change photo" : "+ Photo"}
        </button>
      )}
    </div>
  );
}
