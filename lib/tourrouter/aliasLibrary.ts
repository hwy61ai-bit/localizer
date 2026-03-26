import { supabaseServer } from "@/lib/supabaseServer";
import Anthropic from "@anthropic-ai/sdk";
import { buildColumnMapperPrompt } from "./prompts/columnMapperPrompt";
import { FIELD_ALIASES } from "./columnMapper";

const client = new Anthropic();

export type AliasMatch = {
  field: string;
  confidence: number;
  source: "account" | "agency" | "global" | "builtin" | "claude";
};

/**
 * Normalize a header for lookup: lowercase, trim, strip punctuation, collapse spaces.
 */
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check built-in FIELD_ALIASES from columnMapper.ts (static, no DB call).
 */
function matchBuiltin(normalized: string): string | null {
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      const normAlias = normalizeHeader(alias);
      if (normAlias === normalized) return field;
    }
  }
  // Partial match
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      const normAlias = normalizeHeader(alias);
      if (normalized.includes(normAlias) || normAlias.includes(normalized)) return field;
    }
  }
  return null;
}

/**
 * Resolve headers to TourRouter fields using the three-layer lookup + Claude fallback.
 *
 * Layer 1: Account aliases (org-specific)
 * Layer 2: Agency aliases (agency-specific)
 * Layer 3: Global aliases (confirmed by 3+ accounts)
 * Layer 4: Built-in FIELD_ALIASES
 * Layer 5: Claude batch mapping (ONE API call for all unmatched)
 */
export async function resolveHeaders(
  headers: string[],
  orgId: string,
  sampleRows?: Record<string, string>[],
  agencyName?: string,
): Promise<Record<string, AliasMatch>> {
  const result: Record<string, AliasMatch> = {};
  const unmatched: string[] = [];

  // Normalize all headers
  const normalized = headers.map(normalizeHeader);

  // Batch DB lookup — get all alias matches in one query
  const supabase = await supabaseServer();
  const { data: aliases } = await supabase
    .from("field_aliases")
    .select("raw_header, tourrouter_field, scope, org_id, agency_name, confirmed_count")
    .in("raw_header", normalized)
    .order("scope"); // account first, then agency, then global

  // Build lookup map: normalized → best match
  const aliasMap = new Map<string, { field: string; source: AliasMatch["source"] }>();

  if (aliases) {
    // Process in priority order: account > agency > global
    for (const alias of aliases) {
      const key = alias.raw_header;
      if (aliasMap.has(key)) continue; // Already matched at higher priority

      if (alias.scope === "account" && alias.org_id === orgId) {
        aliasMap.set(key, { field: alias.tourrouter_field, source: "account" });
      } else if (alias.scope === "agency" && agencyName && alias.agency_name === agencyName) {
        aliasMap.set(key, { field: alias.tourrouter_field, source: "agency" });
      } else if (alias.scope === "global" && (alias.confirmed_count ?? 0) >= 3) {
        aliasMap.set(key, { field: alias.tourrouter_field, source: "global" });
      }
    }
  }

  // Resolve each header
  for (let i = 0; i < headers.length; i++) {
    const original = headers[i];
    const norm = normalized[i];

    // Check DB aliases (layers 1-3)
    const dbMatch = aliasMap.get(norm);
    if (dbMatch) {
      result[original] = { field: dbMatch.field, confidence: 0.95, source: dbMatch.source };
      continue;
    }

    // Check built-in aliases (layer 4)
    const builtinMatch = matchBuiltin(norm);
    if (builtinMatch) {
      result[original] = { field: builtinMatch, confidence: 0.9, source: "builtin" };
      continue;
    }

    // Unmatched — will go to Claude
    unmatched.push(original);
  }

  // Layer 5: Claude batch mapping for ALL unmatched headers (one API call)
  if (unmatched.length > 0 && sampleRows && sampleRows.length > 0) {
    try {
      const prompt = buildColumnMapperPrompt(unmatched, sampleRows);
      const msg = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = msg.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("");

      const parsed = JSON.parse(raw);
      const mappings = parsed.mappings || {};

      for (const header of unmatched) {
        const mapping = mappings[header];
        if (mapping && mapping.field && mapping.field !== "unknown") {
          result[header] = {
            field: mapping.field,
            confidence: mapping.confidence || 0.7,
            source: "claude",
          };
        } else {
          result[header] = { field: "", confidence: 0, source: "claude" };
        }
      }
    } catch (e) {
      console.error("[AliasLibrary] Claude mapping failed:", e);
      // Fall back: leave unmatched empty
      for (const header of unmatched) {
        result[header] = { field: "", confidence: 0, source: "claude" };
      }
    }
  } else {
    // No sample rows, just mark as unmatched
    for (const header of unmatched) {
      result[header] = { field: "", confidence: 0, source: "builtin" };
    }
  }

  return result;
}

/**
 * Save a confirmed alias mapping. Called when user confirms a column mapping in the UI.
 */
export async function saveAlias(
  orgId: string,
  headerOriginal: string,
  fieldKey: string,
  scope: "account" | "agency" | "global" = "account",
  agencyName?: string,
): Promise<void> {
  const supabase = await supabaseServer();
  const normalized = normalizeHeader(headerOriginal);

  // Upsert: increment confirmed_count if exists, otherwise insert
  const { data: existing } = await supabase
    .from("field_aliases")
    .select("id, confirmed_count")
    .eq("raw_header", normalized)
    .eq("scope", scope)
    .eq("org_id", scope === "account" ? orgId : null)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("field_aliases")
      .update({
        tourrouter_field: fieldKey,
        confirmed_count: (existing.confirmed_count || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("field_aliases").insert({
      scope,
      org_id: scope === "account" ? orgId : null,
      agency_name: scope === "agency" ? agencyName : null,
      raw_header: normalized,
      tourrouter_field: fieldKey,
      confirmed_count: 1,
    });
  }
}
