"use client";

import { useEffect, useRef, useState } from "react";

interface Place {
  formattedAddress?: string;
  fetchFields(options: { fields: string[] }): Promise<void>;
}

interface PlacePrediction {
  toPlace(): Place;
}

interface PlaceSelectEvent extends Event {
  placePrediction: PlacePrediction;
}

interface PlaceAutocompleteElement extends HTMLElement {
  placeholder: string;
  includedRegionCodes: string[];
}

interface PlacesLibrary {
  PlaceAutocompleteElement: new () => PlaceAutocompleteElement;
}

declare global {
  interface Window {
    google?: {
      maps: {
        importLibrary(name: "places"): Promise<PlacesLibrary>;
      };
    };
  }
}

let placesLibraryPromise: Promise<PlacesLibrary> | null = null;

function loadPlacesLibrary(apiKey: string): Promise<PlacesLibrary> {
  if (window.google?.maps) return window.google.maps.importLibrary("places");
  if (placesLibraryPromise) return placesLibraryPromise;

  placesLibraryPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps could not be loaded."));
    document.head.appendChild(script);
  }).then(async () => {
    if (!window.google?.maps) throw new Error("Google Maps did not initialize.");
    return window.google.maps.importLibrary("places");
  }).catch((error: unknown) => {
    placesLibraryPromise = null;
    throw error;
  });

  return placesLibraryPromise;
}

export function GooglePlaceInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const [widgetReady, setWidgetReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    let disposed = false;
    let element: PlaceAutocompleteElement | null = null;

    void loadPlacesLibrary(apiKey).then((library) => {
      if (disposed || !containerRef.current) return;
      const autocompleteElement = new library.PlaceAutocompleteElement();
      element = autocompleteElement;
      autocompleteElement.placeholder = placeholder;
      autocompleteElement.includedRegionCodes = ["in"];
      autocompleteElement.setAttribute("aria-label", label);
      autocompleteElement.style.width = "100%";
      autocompleteElement.style.minHeight = "44px";
      autocompleteElement.addEventListener("input", () => {
        onChangeRef.current("");
      });
      autocompleteElement.addEventListener("gmp-select", async (rawEvent) => {
        try {
          const event = rawEvent as PlaceSelectEvent;
          const place = event.placePrediction.toPlace();
          await place.fetchFields({ fields: ["formattedAddress"] });
          if (place.formattedAddress) {
            onChangeRef.current(place.formattedAddress);
          }
        } catch (error) {
          console.error("Could not retrieve the selected Google place:", error);
          setLoadError("Could not read that place. Please try another suggestion.");
        }
      });
      containerRef.current.replaceChildren(autocompleteElement);
      setWidgetReady(true);
    }).catch((error: unknown) => {
      console.error("Google Places autocomplete failed to load:", error);
      if (!disposed) setLoadError("Google place suggestions could not be loaded. You can enter the location manually.");
    });

    return () => {
      disposed = true;
      element?.remove();
    };
  }, [apiKey, label, placeholder]);

  if (!apiKey || loadError) {
    return (
      <div>
        <input
          className="cl-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={label}
          required
        />
        {loadError ? <p role="status" className="mt-1 text-xs text-amber-200">{loadError}</p> : null}
        {!apiKey ? <p className="mt-1 text-[11px] text-white/35">Location suggestions can be enabled by configuring the Google Maps API key.</p> : null}
      </div>
    );
  }

  return (
    <div>
      <div ref={containerRef} aria-label={label} />
      {!widgetReady ? <p className="mt-1 text-xs text-white/40">Loading Google place suggestions…</p> : null}
      {widgetReady && value ? <p className="mt-1 text-xs text-mint-300">Selected: {value}</p> : null}
    </div>
  );
}
