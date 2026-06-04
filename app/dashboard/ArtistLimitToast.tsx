"use client";
import { useEffect, useRef } from "react";
import { useToast } from "@/app/components/Toast";

export default function ArtistLimitToast({ show }: { show: boolean }) {
  const toast = useToast();
  const fired = useRef(false);

  useEffect(() => {
    if (show && !fired.current) {
      fired.current = true;
      toast.error("You've reached your plan's artist limit. Upgrade to add more artists.");
      // Strip ?error=artist_limit so re-renders/back-nav don't re-fire the toast.
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [show, toast]);

  return null;
}
