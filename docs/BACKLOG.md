# HWY61 Backlog

Forward-looking list of features, refactors, and design questions to revisit after Phase 7 launch. Not a commitment — a parking lot. Items here require Tim sign-off before moving to the build plan.

## Post-launch considerations

### In-app chatbot

Goal: user-facing helper chatbot inside TourRouter/Localizer that answers questions about how to use the app and, ideally, about the user's specific current context.

**Tier 1 — Docs-aware helper (~3–5 days build)**
- Claude API call with system prompt containing help docs, feature descriptions, common workflows
- Answers general "how do I..." questions from docs only
- No knowledge of user's actual data — read-only, low risk
- Best implemented with RAG (retrieval-augmented generation) over indexed docs so it scales as the app grows
- Hidden cost: requires real user-facing help docs to exist first (currently lives in session log, build plan, Drew's head). ~2–3 weeks of writing before the bot is worth building. Tim will have opinions on voice/content.

**Tier 2 — Context-aware helper (~2–3 weeks build, after Tier 1)**
- Same as Tier 1, plus current page context passed into each message ("user is on Settlement screen, Tour X, Leg 4, Stuttgart show")
- Can answer specific questions like "why is my fuel cost high on this leg?" with real data
- Still read-only — no writes, no tool calls, no edits on user's behalf
- Sanitized data snapshot per message; no persistent access

**Deliberately skipped: Tier 3 (agentic helper with write access).** Same risk profile as managed agents — new attack surface for RLS bypasses, silent write failures, user error via liberal interpretation. Revisit only after product is stable.

**Dependencies before starting:** written help docs, Tim sign-off on scope and voice, decision on RAG infrastructure (likely Supabase pgvector since we're on Postgres — no new vendor).

---

### Onboarding wizard — per-user vs per-org state mismatch

`orgs.onboarding_completed` is org-level state, but `org_members.user_role` is per-user. When a new user joins an existing onboarded org, they skip the wizard entirely and never get a chance to set their role.

**Example found April 9, 2026:** Drew completed the wizard on HWY 61 TEST CO. and got user_role = Tour Manager. Tim is also a member of the same org with user_role = null because the wizard only runs once per org, not once per user.

**Possible fixes (need Tim's input):**
1. Move onboarding state to org_members so each user onboards independently (org_members.onboarding_completed, org_members.onboarding_step)
2. Keep onboarding_completed on orgs but add a lightweight "role picker" prompt that fires on first login for any member whose user_role is null, regardless of org-level state
3. Accept the gap — assume Tim's beta invites will be sent to users who create their own orgs, not users joining existing orgs

**Decision needed before beta launch** since Tim's beta users will be joining orgs Tim already created for them.

---

### Audit and clean up stale test workspaces

As of April 9, 2026, the orgs table has 12 rows all named "My Workspace" — leftover test accounts from earlier development. Before public launch, audit and delete any that aren't tied to active users (Drew, Tim, or beta invitees).

---

### OnboardingGate / old welcome choice screen retirement

app/components/OnboardingWizard.tsx (the GET STARTED / EXPLORE DEMO / SKIP welcome choice screen) still renders on dashboard login for users with zero artists. Its role is being absorbed by the new three-field WelcomeWizard plus the demo tour button that will eventually live inside it. Retire the old choice screen and OnboardingGate wrapper once:
1. Tim delivers demo tour seed data and the demo tour button is wired into the new wizard
2. The new wizard covers the "fresh user with nothing" state end-to-end

Until then, both flows coexist: WelcomeWizard runs once per org on first login, and OnboardingGate still shows to users with zero artists.
