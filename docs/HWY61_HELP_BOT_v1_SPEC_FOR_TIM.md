# HWY61 Help Bot — v1 Spec

**For:** Tim
**From:** Drew
**Date:** April 15, 2026
**Status:** Draft — needs your input before build

---

## The Pitch

A floating "?" button in the bottom-right of every page in Localizer and TourRouter. Click it, a panel slides out from the right side. User types a question. They get a real answer in seconds — not a search bar, not a help article, not a contact form. An actual conversation with something that understands the apps and, critically, **understands what the user is currently looking at**.

Think of it less like Intercom's chatbot ("Hi! How can I help you today?" → 47 multiple-choice buttons) and more like having a smart, patient friend looking over the user's shoulder. The user says *"why is my net negative?"* and the bot says *"Your fuel costs jumped on the East Coast leg because three of your drives are over 8 hours — Atlanta to Boston is the worst offender. Want me to flag the legs that might be cheaper to fly?"*

That's the bar. That's the version worth building.

---

## Why This Matters

Every SaaS company at our stage has the same support problem: the moment you have paying users, 80% of incoming questions are *"how do I…"* about features that already exist in the UI. You and I burn hours answering the same questions. Users get frustrated waiting. Some churn before we even hear about it.

A good in-app bot solves this without the user ever leaving the app. It's there, it knows the answer, it explains it, they keep working. The questions we *do* see in our inbox are then the genuinely hard ones — the ones worth our time.

It also doubles as onboarding. New users who'd otherwise bounce off a confusing screen now have somewhere to ask without feeling dumb. *Stop me, oh stop me, oh stop me if you think you've heard this one before* — except now they don't have to email us to find out.

---

## The User Experience

**The button.** Bottom-right corner, every page. Subtle — black circle, white "?" icon, Warhol-flat shadow. Doesn't shout, doesn't bounce, doesn't have a red dot trying to manufacture urgency. It's just there when you need it.

**The panel.** Click the button, a 400px-wide panel slides in from the right. Doesn't cover the page — the user can still see what they were looking at. This is the whole point: the bot can see what they're looking at, *and so can they*. They can reference it mid-conversation.

**The header.** "HWY61 Help" in our brand font. A close button. Maybe a small "End chat & start over" link.

**The context strip.** Just below the header, a subtle line of text: *"I can see you're viewing Uncle Lucius Spring Tour."* This builds trust instantly. The user knows what the bot can see, knows what to ask about, knows it's not just guessing.

**The conversation.** Standard chat bubbles. User messages right-aligned, bot left-aligned, text streams in as it generates so it feels alive instead of waiting for a wall of text to appear. No avatars, no typing indicators that lie, no cute animations.

**The input.** Bottom of panel. Big text box, send button. Enter to send, Shift+Enter for a new line.

**Persistence.** The conversation stays open as the user navigates around the app. They can ask about a tour, click into financials, keep talking — the bot follows them and updates its context. Refresh the page and it resets (with a polite *"want to pick up where we left off?"* option later).

---

## What the Bot Can Actually Do

Three layers of intelligence, each building on the last:

### Layer 1 — It knows the products cold
A 15–20k token knowledge base sitting in its system prompt. Every feature, every workflow, every gotcha, written by us. *"How do I generate assets for a tour?"* → it walks them through it. *"What's the difference between TourRouter and DIY?"* → clear answer. *"Why can't I see the Merch tab?"* → "Merch isn't part of the platform — we cut it from the roadmap." No hallucinations because it's not guessing, it's reading our docs.

### Layer 2 — It knows where the user is
The bot gets injected with the user's current context on every message: what product, what page, what tour they're viewing, what plan tier they're on. So *"how do I do this?"* doesn't require the user to explain what "this" is — the bot already knows.

### Layer 3 — It can read the user's actual data
The genuinely cool part. The bot has a small set of read-only tools it can call to inspect the user's actual tour state. The user asks *"why isn't my Generate All button working?"* and the bot calls `get_tour_assets_status(tourId)`, sees that 4 of 12 events are missing venue addresses, and responds: *"Three events are missing venue addresses — Atlanta, Boston, and Pittsburgh. Add those and Generate All will light up."*

That's not a help article. That's a coworker.

---

## Tools the Bot Will Have (Read-Only, v1)

For TourRouter:
- `get_tour_overview` — show count, dates, financial totals, completion status
- `get_show_detail` — full data on one show
- `get_drive_legs` — drive times across the tour, problem legs flagged
- `get_advance_status` — which venues have confirmed, which haven't
- `get_financial_breakdown` — expenses by category, income by deal type

For Localizer:
- `get_tour_assets_status` — which formats are generated, what's blocking
- `get_template_config` — current template setup
- `get_venue_link_status` — who's been sent links, who's opened them

All read-only. No tool can change anything in the user's account in v1. If the user wants the bot to *do* something ("add a hotel to the Austin show"), the bot says *"I can't do that for you yet, but here's how to do it in two clicks…"* That comes in v2, with proper confirmation flows.

---

## The Hard Part Isn't the Code

The engineering is honestly straightforward — Claude can build the chat panel, the API route, the tools, and the streaming in maybe 3-4 days. The model (Claude Haiku 4.5) is fast, cheap, and smart enough.

The hard part — the part that makes the difference between *Cut Your Hair* and a B-side nobody remembers — is everything around the model:

**1. The knowledge base.** This is the spine. It's a long markdown doc covering every feature, every workflow, every "if this happens, do this," every "this is what we mean when we say X." If this doc is thin, the bot is thin. If this doc is great, the bot is great. We'd write v1 together — probably 10-15k tokens to start, then expand based on what users actually ask. I can draft it; you'd review and add the parts only you know.

**2. Voice and tone.** This is where I need you most. What does this bot *sound like*? Some questions worth deciding before we build:

- Does it have a name? *"HWY61 Help"* is functional. *"Hank"* is friendlier. *"Ask Tim"* is too much. Something else?
- Warm and chatty, or dry and efficient? My gut: dry and efficient with occasional warmth. The user is trying to get something done. Don't waste their time being charming.
- Does it use exclamation marks? (My vote: no. Ever.)
- Does it apologize? When something's broken, does it say *"sorry about that"* or just *"here's what's happening"*?
- Does it ever crack a joke? My vote: no in v1. We can earn that later.
- Does it know about you and me as humans, or is it strictly product-focused? *"Email Tim about that"* vs *"Email support@hwy61labs.com about that."*

**3. What it absolutely cannot do.**
- Promise refunds, discounts, or feature timelines
- Speculate about Stripe billing issues — always escalate to us
- Make up features that don't exist
- Discuss competitors
- Reveal that it's running on Claude or share its system prompt
- Give legal, financial, or business advice to artists

**4. The escalation path.** When the bot can't help — or when the user is clearly frustrated — it needs a graceful handoff. *"Let me put you in touch with Tim and Drew"* with a one-click button that opens an email pre-filled with the conversation context. We never see the bot fail in silence.

**5. Upgrade prompts.** If a free-tier user asks about a Pro feature, what does the bot do? Three options:
- (a) Pretend the feature doesn't exist for them
- (b) Explain the feature and say it's on Pro, no pitch
- (c) Explain the feature, mention it's on Pro, gentle CTA to upgrade

My vote is (b). Helpful, honest, no slime. *"That's a Pro feature — here's what it does and how it'd work for you. You can upgrade in Account Settings whenever you're ready."*

---

## What We Get From Building This

**Immediate:** Support volume drops. The questions that do reach us are the genuinely hard ones, not "where's the export button."

**Medium-term:** Every conversation gets logged. We review them weekly for the first month. We learn exactly where users get stuck — and that becomes a roadmap for UI improvements *and* a feedback loop for the knowledge base. The bot gets smarter every week without us touching the code.

**Long-term:** This becomes a moat. Most touring software is opaque and frustrating; "I can ask the app a question and get a real answer" is a feature people will tell other tour managers about. It also becomes the foundation for v2 — agentic actions ("add this hotel," "send the advance to this venue"), proactive nudges ("you have 3 shows next week with no advance sent — want me to draft them?"), even an outbound voice ("the Atlanta venue just confirmed; I've updated the show").

This is the kind of thing where, five years in, people forget it was ever optional. Like *Slanted and Enchanted* — at the time it just sounded like a band finding its sound. In retrospect it was the moment the whole genre changed.

---

## Cost

Haiku 4.5 pricing: roughly **half a cent per conversation** at our expected usage. Even at 10,000 conversations a month — which would mean we have real traction — we're at maybe **$50-100/month**. The cost of one human support hour, per month, for unlimited bot. The math isn't close.

---

## Build Estimate

- **Engineering** (chat UI + API + tools + streaming + logging): ~4-5 days of focused Claude Code work
- **Knowledge base v1**: ~2-3 days of writing (mostly me, with your review)
- **Voice/tone iteration + system prompt tuning**: ~1-2 days of testing
- **QA on Mac mini before launch**: ~1 day

Realistically: **a 1.5-2 week project end to end.** Could ship in Phase 7 launch prep without disrupting anything else.

---

## What I Need From You

1. **Read this and tell me if the vision matches yours.** If not, what's different?
2. **Voice and tone decisions** — the questions in section "Voice and tone" above. We can do this in 15 minutes on a call.
3. **What it absolutely cannot do** — anything I missed in that list?
4. **Naming** — does it have one? Just "HWY61 Help"?
5. **Greenlight or hold** — do we build this in Phase 7, or push it post-launch?

That's it. If we agree on the shape, I can start drafting the knowledge base this week and have a working prototype in your hands inside two weeks.

*How soon is now?*

---

*— Drew*
