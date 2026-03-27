import { useState, useEffect, useRef, useCallback } from "react";

export type ContactSuggestion = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  anonymous_flag_count: number;
  relationship_rating: number | null;
};

export type ContactAutocompleteResult = {
  suggestions: ContactSuggestion[];
  loading: boolean;
  select: (contact: ContactSuggestion) => {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  clear: () => void;
};

/**
 * React hook for contact autocomplete.
 *
 * Usage:
 *   const { suggestions, loading, select } = useContactAutocomplete(inputValue, 'Promoter');
 *
 *   // Render dropdown of suggestions below input
 *   // On select:
 *   const fields = select(contact);
 *   setPromoterName(fields.name);
 *   setPromoterEmail(fields.email);
 *   setPromoterPhone(fields.phone);
 */
export function useContactAutocomplete(
  query: string,
  role?: string,
): ContactAutocompleteResult {
  const [suggestions, setSuggestions] = useState<ContactSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (q: string, r?: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: "5" });
      if (r) params.set("role", r);
      const resp = await fetch(`/api/tourrouter/contacts?${params}`, {
        signal: controller.signal,
      });
      if (resp.ok) {
        const data = await resp.json();
        setSuggestions(data.contacts || []);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setSuggestions([]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query, role), 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, role, fetchSuggestions]);

  const select = useCallback((contact: ContactSuggestion) => ({
    name: contact.name || "",
    email: contact.email || "",
    phone: contact.phone || "",
    company: contact.company || "",
  }), []);

  const clear = useCallback(() => {
    setSuggestions([]);
  }, []);

  return { suggestions, loading, select, clear };
}
