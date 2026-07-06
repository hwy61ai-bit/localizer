export type ConsentChoice = "accepted" | "declined";

export type ConsentEventDetail = ConsentChoice | null;

const KEY = "hw_cookie_consent";

export const CONSENT_EVENT = "hw-consent-changed";

export function getConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === "accepted" || raw === "declined") return raw;
    return null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, choice);
  } catch {
    // Safari private mode / storage disabled — swallow.
  }
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
  } catch {
    // Extremely old browsers without CustomEvent — swallow.
  }
}

export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Safari private mode / storage disabled — swallow.
  }
  try {
    window.dispatchEvent(new CustomEvent<ConsentEventDetail>(CONSENT_EVENT, { detail: null }));
  } catch {
    // Extremely old browsers without CustomEvent — swallow.
  }
}
