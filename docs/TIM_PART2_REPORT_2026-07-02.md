# Part 2 Report — Verification Findings & Schedule Read
**From Drew | July 2, 2026 | Responds to DREW_HANDOFF_LEGAL_LAUNCH_SCOPE_2026-07-02**

All five verification items are done. Three findings need fixes; two came back healthy. Bottom line and schedule read at the end.

---

## Item 1 — Venue-link token entropy: ✅ HEALTHY

Tokens are cryptographically random and long. Venue links (/v/e/) use 256-bit random tokens; marketing links (/v/m/ and /v/tour/) use 192-bit. Nothing sequential, nothing guessable, nothing derived from database IDs. Brute-forcing these over the internet is not a realistic attack. No changes needed here.

## Item 2 — Search indexing: 🔴 NOTHING EXISTS TODAY

Venue-link pages currently have zero protection against search engines. If a tokenized link gets posted anywhere a crawler can see it (a public tweet, a forum, certain link previews), Google is allowed to index that page. Fix is small and standard: a "noindex" instruction on all three public page types plus a server header as backup. **~1 hour. Will ship before launch.**

## Item 3 — Referrer leakage: 🟡 PARTIAL — one gap

Good news: every clickable outbound link (press, socials, Meta help links) was already built correctly and does not leak the page URL. The gap: images, videos, and the Spotify player load automatically when the page opens, and each of those loads currently tells Cloudinary/Spotify the full tokenized URL. Fix is a one-line page policy. **Minutes. Will ship before launch.**

## Item 4 — Direct asset URLs: 🔴 THE REAL FINDING

This is the one that matters. **W-9 files are stored in a public bucket at a predictable address.** The pattern is essentially: fixed-prefix / artist-ID / advance / adv_w9_url.pdf. Anyone who learns an artist's internal ID can fetch the tax document directly — no venue link, no token, no login — and the file stays fetchable forever until deleted. The venue-link token protects the *page*, not the *files*. Stage plot, hospitality, and FOH docs have the same exposure (lower sensitivity, same mechanism).

**The fix merges with your Part 1 item 2 (W-9 acknowledgment gate) into one build:**
- Move W-9 + advance docs to a new **private** bucket. Old public URLs die in the migration.
- The W-9 link on venue pages becomes: click → your confirmation copy → server verifies the venue-link token → **logs the access** (timestamp + token) → hands over the file via a short-lived signed URL.
- Stage plot / hospitality / FOH also move private, served via signed URLs (no confirm step — they're not tax documents).
- Artist logos and photos stay public — they're meant to be seen.

So item 4's fix and your acknowledgment-gate requirement are the same construction project. **~1 to 1.5 days including migration of existing files.**

## Item 5 — Current signup assent: 🟡 HALF-BUILT ALREADY

Signup and login are one combined flow (magic link or Google — no separate signup form). It already shows, directly under the buttons: "By continuing, you agree to our Terms of Service and Privacy Policy" with working links. What's missing versus your Part 1 item 3: the **required checkbox**. So the remaining work is adding a checkbox to a form that already has the notice line. **~Half a day including making it required and styling.**

---

## Item 6 — Schedule read

| Work | Size |
|---|---|
| noindex + referrer fixes (items 2–3) | ~1 hour |
| W-9 private storage + acknowledgment gate + access log (item 4 + your Part 1 item 2) | 1–1.5 days |
| Visibility toggles (your Part 1 item 1: team contacts / advance docs / W-9, defaults ON) | 1–2 days |
| Signup checkbox (your Part 1 item 3) | 0.5 day |
| Cookie consent banner, built properly — analytics off until consent (your Part 1 item 4) | ~1 day |
| Legal text deploy + launch-day snapshot (your Part 1 item 5) | 0.5 day, gated on your final text |

**Total: roughly 5–7 working days of build + QA.** This runs in parallel with your Privacy/Terms text finalization — nothing above waits on the final text except the deploy itself. Honest answer to "does this move the launch date": yes, by about a week from today's engineering-ready state.

One more thing for the Privacy rewrite: item 4 strengthens the case for the §3 language change. Until the fix ships, the documents §3 doesn't mention aren't just displayed on venue pages — they're publicly fetchable. The rewrite and the fix should land together.

**Decisions I've made under "architecture is yours" (flag if you disagree):** private-bucket + signed-URL delivery for advance docs; logos/photos remain public; access log captures timestamp + link token + requester IP; toggles will live per-artist unless the build reveals per-link is cleaner.

— Drew
