"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { colleges } from "@/lib/data/colleges";
import {
  applyAccessibilityPreferences,
  DEFAULT_SETTINGS_PREFERENCES,
  readSettingsPreferences,
  saveSettingsPreferences,
  SETTINGS_PREFERENCES_EVENT,
  type SettingsPreferences as Preferences,
} from "@/lib/settingsPreferences";

export function SettingsPreferences({ userId }: { userId: string }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_SETTINGS_PREFERENCES);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = readSettingsPreferences(userId);
    setPreferences(stored);
    applyAccessibilityPreferences(stored);
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, [userId]);

  const update = useCallback((patch: Partial<Preferences>) => {
    const next = saveSettingsPreferences(userId, patch);
    setPreferences(next);
    applyAccessibilityPreferences(next);
    setMessage("Settings saved on this device.");
  }, [userId]);

  async function setBuyerNotifications(enabled: boolean) {
    setMessage("");
    if (!enabled) {
      update({ buyerInterestNotifications: false });
      return;
    }
    if (typeof Notification === "undefined") {
      setMessage("Browser notifications are not supported in this browser.");
      return;
    }
    try {
      const result = Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;
      setPermission(result);
      if (result !== "granted") {
        setMessage(result === "denied"
          ? "Notifications are blocked in browser settings. Allow them there, then try again."
          : "Notification permission was not granted.");
        return;
      }
      update({ buyerInterestNotifications: true });
    } catch (error) {
      console.error("Could not request browser notification permission:", error);
      setMessage("Could not enable browser notifications. Check your browser settings and try again.");
    }
  }

  return (
    <>
      <div className="cl-panel cl-panel-solid mt-5 p-6">
        <h2 className="text-base font-bold text-white">Notifications</h2>
        <p className="mt-1 text-sm text-white/50">Choose whether this browser can alert you about marketplace activity.</p>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/4 p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-indigo-400"
            checked={preferences.buyerInterestNotifications}
            disabled={permission === "unsupported"}
            onChange={(event) => void setBuyerNotifications(event.target.checked)}
          />
          <span>
            <span className="block text-sm font-semibold text-white">Notify me when someone is interested in my listing</span>
            <span className="mt-1 block text-xs text-white/45">
              Browser alerts work while CampusLoop is open. Permission: {permission}.
            </span>
          </span>
        </label>
      </div>

      <div className="cl-panel cl-panel-solid mt-5 p-6">
        <h2 className="text-base font-bold text-white">Privacy</h2>
        <p className="mt-1 text-sm text-white/50">Choose how your name appears on home and room listings you create.</p>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/4 p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-indigo-400"
            checked={preferences.showNameOnHomeListings}
            onChange={(event) => update({ showNameOnHomeListings: event.target.checked })}
          />
          <span>
            <span className="block text-sm font-semibold text-white">Show my display name on new home/room listings</span>
            <span className="mt-1 block text-xs text-white/45">When off, new listings use “CampusLoop member” instead. Existing listings are unchanged.</span>
          </span>
        </label>
      </div>

      <div className="cl-panel cl-panel-solid mt-5 p-6">
        <h2 className="text-base font-bold text-white">Accessibility</h2>
        <p className="mt-1 text-sm text-white/50">Adjust text size and motion effects across the website.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-white/50">Text size</span>
            <select
              className="cl-input"
              value={preferences.fontSize}
              onChange={(event) => update({ fontSize: event.target.value as Preferences["fontSize"] })}
            >
              <option value="standard">Standard</option>
              <option value="large">Large</option>
              <option value="largest">Largest</option>
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/4 p-4">
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-400"
              checked={preferences.reduceMotion}
              onChange={(event) => update({ reduceMotion: event.target.checked })}
            />
            <span className="text-sm font-semibold text-white">Reduce animation and motion</span>
          </label>
        </div>
      </div>

      <div className="cl-panel cl-panel-solid mt-5 p-6">
        <h2 className="text-base font-bold text-white">Marketplace defaults</h2>
        <p className="mt-1 text-sm text-white/50">Choose the filters used when you open the second-hand marketplace.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-white/50">Default category</span>
            <select
              className="cl-input"
              value={preferences.marketplaceCategory}
              onChange={(event) => update({ marketplaceCategory: event.target.value as Preferences["marketplaceCategory"] })}
            >
              <option value="all">Books and devices</option>
              <option value="book">Books</option>
              <option value="device">Second-hand devices</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-white/50">Default campus</span>
            <select
              className="cl-input"
              value={preferences.marketplaceCampusId}
              onChange={(event) => update({ marketplaceCampusId: event.target.value })}
            >
              <option value="">All campuses</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id} className="bg-ink-900">{college.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {message ? <p role="status" className="mt-4 text-sm text-white/55">{message}</p> : null}
    </>
  );
}

export function SettingsAccessibilityEffect() {
  const { user } = useAuth();
  useEffect(() => {
    const userId = user?.uid ?? "guest";
    const apply = () => applyAccessibilityPreferences(readSettingsPreferences(userId));
    apply();
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string; preferences: Preferences }>).detail;
      if (detail?.userId === userId) applyAccessibilityPreferences(detail.preferences);
    };
    window.addEventListener(SETTINGS_PREFERENCES_EVENT, handleChange);
    return () => window.removeEventListener(SETTINGS_PREFERENCES_EVENT, handleChange);
  }, [user?.uid]);
  return null;
}
