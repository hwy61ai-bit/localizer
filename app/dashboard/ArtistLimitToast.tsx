"use client";
import { useEffect } from "react";
import { useToast } from "@/app/components/Toast";

export default function ArtistLimitToast({ show }: { show: boolean }) {
  const toast = useToast();
  useEffect(() => {
    if (show) {
      toast.error("You've reached your plan's artist limit. Upgrade to add more artists.");
    }
  }, [show, toast]);
  return null;
}
