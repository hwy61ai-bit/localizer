// Fetches .ttf font bytes for use in pdf-lib
// For custom fonts: fetch from Supabase Storage URL
// For Google Fonts: fetch .ttf from Google Fonts CSS API

export async function fetchFontBytes(
  fontFamily: string,
  customFonts: Array<{ font_name: string; storage_url: string }>
): Promise<Uint8Array> {
  // 1. Check if it's a custom font
  const custom = customFonts.find(f => f.font_name === fontFamily);
  if (custom && custom.storage_url) {
    const res = await fetch(custom.storage_url);
    if (!res.ok) throw new Error(`Failed to fetch custom font: ${fontFamily}`);
    return new Uint8Array(await res.arrayBuffer());
  }

  // 2. Google Font — fetch the CSS, extract .ttf URL
  // User-Agent: Mozilla/5.0 forces Google to return .ttf instead of .woff2
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@700&display=swap`;
  const cssRes = await fetch(cssUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!cssRes.ok) throw new Error(`Failed to fetch Google Fonts CSS for: ${fontFamily}`);
  const cssText = await cssRes.text();

  // Extract the .ttf URL from the CSS @font-face src
  const ttfMatch = cssText.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/);
  if (!ttfMatch) {
    throw new Error(`Could not find .ttf URL for font: ${fontFamily}`);
  }

  const fontRes = await fetch(ttfMatch[1]);
  if (!fontRes.ok) throw new Error(`Failed to download .ttf for font: ${fontFamily}`);
  return new Uint8Array(await fontRes.arrayBuffer());
}
