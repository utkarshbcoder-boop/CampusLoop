"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCollection } from "@/lib/firebase/hooks";
import {
  readSettingsPreferences,
  SETTINGS_PREFERENCES_EVENT,
} from "@/lib/settingsPreferences";

interface ListingInterest {
  id: string;
  listing_id: string;
}

export function MarketplaceNotificationListener() {
  const { user } = useAuth();
  if (!user) return null;
  return <UserMarketplaceNotificationListener userId={user.uid} />;
}

function UserMarketplaceNotificationListener({ userId }: { userId: string }) {
  const interests = useCollection<ListingInterest>("listing_interests", {
    whereField: "seller_id",
    whereValue: userId,
  });
  const seenIds = useRef<Set<string> | null>(null);
  const observedUserId = useRef(userId);
  const notificationEnabled = useRef(false);

  useEffect(() => {
    const updatePreference = () => {
      notificationEnabled.current = readSettingsPreferences(userId).buyerInterestNotifications;
    };
    updatePreference();
    window.addEventListener(SETTINGS_PREFERENCES_EVENT, updatePreference);
    return () => window.removeEventListener(SETTINGS_PREFERENCES_EVENT, updatePreference);
  }, [userId]);

  useEffect(() => {
    if (interests.loading || interests.error) return;
    if (observedUserId.current !== userId) {
      observedUserId.current = userId;
      seenIds.current = null;
      return;
    }
    const currentIds = new Set(interests.data.map((interest) => interest.id));
    if (seenIds.current === null) {
      seenIds.current = currentIds;
      return;
    }

    const newInterests = interests.data.filter((interest) => !seenIds.current?.has(interest.id));
    seenIds.current = currentIds;
    if (
      !notificationEnabled.current
      || typeof Notification === "undefined"
      || Notification.permission !== "granted"
    ) return;

    for (const interest of newInterests) {
      new Notification("Someone is interested in your listing", {
        body: `A student registered interest in listing ${interest.listing_id}.`,
        tag: interest.id,
      });
    }
  }, [interests.data, interests.error, interests.loading, userId]);

  return null;
}
