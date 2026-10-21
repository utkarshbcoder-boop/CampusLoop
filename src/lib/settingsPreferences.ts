export type FontSizePreference = "standard" | "large" | "largest";
export type MarketplaceCategoryPreference = "all" | "book" | "device";

export interface SettingsPreferences {
  buyerInterestNotifications: boolean;
  showNameOnHomeListings: boolean;
  fontSize: FontSizePreference;
  reduceMotion: boolean;
  marketplaceCategory: MarketplaceCategoryPreference;
  marketplaceCampusId: string;
}

export const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferences = {
  buyerInterestNotifications: false,
  showNameOnHomeListings: true,
  fontSize: "standard",
  reduceMotion: false,
  marketplaceCategory: "all",
  marketplaceCampusId: "",
};

export const SETTINGS_PREFERENCES_EVENT = "campusloop:settings-preferences";

function storageKey(userId: string): string {
  return `campusloop:settings:${userId}`;
}

export function readSettingsPreferences(userId: string): SettingsPreferences {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_SETTINGS_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<SettingsPreferences>;
    return {
      ...DEFAULT_SETTINGS_PREFERENCES,
      ...parsed,
      fontSize: ["standard", "large", "largest"].includes(String(parsed.fontSize))
        ? parsed.fontSize as FontSizePreference
        : DEFAULT_SETTINGS_PREFERENCES.fontSize,
      marketplaceCategory: ["all", "book", "device"].includes(String(parsed.marketplaceCategory))
        ? parsed.marketplaceCategory as MarketplaceCategoryPreference
        : DEFAULT_SETTINGS_PREFERENCES.marketplaceCategory,
    };
  } catch {
    return DEFAULT_SETTINGS_PREFERENCES;
  }
}

export function saveSettingsPreferences(
  userId: string,
  patch: Partial<SettingsPreferences>,
): SettingsPreferences {
  const next = { ...readSettingsPreferences(userId), ...patch };
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch (error) {
    console.error("Could not save settings preferences:", error);
  }
  window.dispatchEvent(new CustomEvent(SETTINGS_PREFERENCES_EVENT, { detail: { userId, preferences: next } }));
  return next;
}

export function applyAccessibilityPreferences(preferences: SettingsPreferences): void {
  const root = document.documentElement;
  root.style.fontSize = preferences.fontSize === "largest"
    ? "125%"
    : preferences.fontSize === "large"
      ? "112.5%"
      : "";

  const styleId = "campusloop-reduced-motion";
  let style = document.getElementById(styleId) as HTMLStyleElement | null;
  if (preferences.reduceMotion) {
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
      }
    `;
  } else {
    style?.remove();
  }
}
