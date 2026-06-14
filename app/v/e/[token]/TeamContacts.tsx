// Server component — mirrors SocialIcons.tsx / PressPlaylists.tsx pattern.
// Source of truth for fixed roles is the artist profile editor (TEAM_ROLES in
// app/dashboard/artists/[artistId]/profile/page.tsx). Order kept in sync.
// Custom members come from the artist's team_extra jsonb column and render
// after the fixed roles in the same uniform card grid.

type FixedRole = { key: string; label: string };

const TEAM_ROLES: FixedRole[] = [
  { key: "manager", label: "Manager" },
  { key: "tour_manager", label: "Tour Manager" },
  { key: "booking_agent", label: "Booking Agent" },
  { key: "publicist", label: "Publicist" },
];

type TeamExtraMember = {
  id: string;
  role: string;
  name: string;
  email: string;
  phone: string;
};

type ArtistTeamFields = Partial<{
  manager_name: string | null;
  manager_email: string | null;
  manager_phone: string | null;
  tour_manager_name: string | null;
  tour_manager_email: string | null;
  tour_manager_phone: string | null;
  booking_agent_name: string | null;
  booking_agent_email: string | null;
  booking_agent_phone: string | null;
  publicist_name: string | null;
  publicist_email: string | null;
  publicist_phone: string | null;
  team_extra: TeamExtraMember[] | null;
}>;

type Props = {
  label: string;
  artist: ArtistTeamFields | null | undefined;
};

type Card = { key: string; label: string; name: string; email: string; phone: string };

function clean(s: string | null | undefined): string {
  return (s ?? "").trim();
}

export function TeamContacts(props: Props) {
  const a = (props.artist ?? {}) as Record<string, unknown>;

  const fixedCards: Card[] = TEAM_ROLES.map((role) => ({
    key: role.key,
    label: role.label,
    name: clean(a[`${role.key}_name`] as string | null | undefined),
    email: clean(a[`${role.key}_email`] as string | null | undefined),
    phone: clean(a[`${role.key}_phone`] as string | null | undefined),
  }));

  const extra = (a.team_extra as TeamExtraMember[] | null | undefined) ?? [];
  const customCards: Card[] = extra.map((m) => ({
    key: m.id,
    label: clean(m.role),
    name: clean(m.name),
    email: clean(m.email),
    phone: clean(m.phone),
  }));

  const cards: Card[] = [...fixedCards, ...customCards].filter(
    (c) => c.name || c.email || c.phone
  );

  if (cards.length === 0) return null;

  return (
    <div style={{ marginBottom: 48 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .team-contact-link { transition: color 0.15s ease; }
        .team-contact-link:hover { color: var(--hw-crimson); }
      ` }} />
      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 16, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", paddingBottom: 10, borderBottom: "2px solid var(--hw-text)", marginBottom: 20 }}>
        {props.label}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {cards.map((card) => (
          <div
            key={card.key}
            style={{
              padding: 16,
              background: "var(--hw-bg-surface)",
              border: "3px solid var(--hw-border-strong)",
            }}
          >
            {card.label && (
              <div
                style={{
                  fontFamily: "var(--hw-font-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  color: "var(--hw-text-muted)",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                {card.label}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {card.name && (
                <div
                  style={{
                    fontFamily: "var(--hw-font-display)",
                    fontSize: 24,
                    lineHeight: 1.1,
                    color: "var(--hw-text)",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                  }}
                >
                  {card.name}
                </div>
              )}
              {card.email && (
                <a
                  href={`mailto:${card.email}`}
                  className="team-contact-link"
                  style={{
                    fontFamily: "var(--hw-font-body)",
                    fontSize: 14,
                    color: "var(--hw-text)",
                    textDecoration: "none",
                    wordBreak: "break-all",
                  }}
                >
                  {card.email}
                </a>
              )}
              {card.phone && (
                <a
                  href={`tel:${card.phone}`}
                  className="team-contact-link"
                  style={{
                    fontFamily: "var(--hw-font-body)",
                    fontSize: 14,
                    color: "var(--hw-text)",
                    textDecoration: "none",
                  }}
                >
                  {card.phone}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
