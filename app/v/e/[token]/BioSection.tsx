// Server component — mirrors TeamContacts.tsx / PressPlaylists.tsx structure.
// Renders the artist's `bio` column as prose. Hides entirely when bio is
// empty or whitespace-only (matches the sibling sections' early-return-null
// hide-when-empty pattern).

type Props = {
  label: string;
  bio: string | null | undefined;
};

export function BioSection(props: Props) {
  const bio = props.bio;
  if (!bio || !bio.trim()) return null;

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 16, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", paddingBottom: 10, borderBottom: "2px solid var(--hw-text)", marginBottom: 20 }}>
        {props.label}
      </div>
      <div
        style={{
          fontFamily: "var(--hw-font-body)",
          fontSize: 16,
          lineHeight: 1.6,
          color: "var(--hw-text)",
          whiteSpace: "pre-wrap",
        }}
      >
        {bio}
      </div>
    </div>
  );
}
