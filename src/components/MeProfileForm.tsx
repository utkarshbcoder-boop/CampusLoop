"use client";

import { useState } from "react";
import { colleges } from "@/lib/data/colleges";

interface MeProfileFormProps {
  defaults: {
    name: string;
    college_id: string;
    year_of_study: number;
    credits: number;
    rating: number;
    skills: string[];
  };
}

export function MeProfileForm({ defaults }: MeProfileFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaults.name);
  const [collegeId, setCollegeId] = useState(defaults.college_id);
  const [year, setYear] = useState(defaults.year_of_study);
  const [credits, setCredits] = useState(defaults.credits);
  const [rating, setRating] = useState(defaults.rating);
  const [skills, setSkills] = useState(defaults.skills.join(", "));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        college_id: collegeId,
        year_of_study: Number(year) || 1,
        credits: Number(credits) || 0,
        rating: Number(rating) || 0,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    window.location.reload();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/5 hover:text-white"
      >
        Edit my profile
      </button>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      <input
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
      />
      <select
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        value={collegeId}
        onChange={(e) => setCollegeId(e.target.value)}
      >
        {colleges.map((c) => (
          <option key={c.id} value={c.id} className="bg-neutral-900">
            {c.short_name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          min={1}
          max={6}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          placeholder="Year"
        />
        <input
          type="number"
          min={0}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          value={credits}
          onChange={(e) => setCredits(Number(e.target.value))}
          placeholder="Credits"
        />
        <input
          type="number"
          min={0}
          max={5}
          step={0.1}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          placeholder="Rating"
        />
      </div>
      <input
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
        placeholder="Skills, comma separated"
      />
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 rounded-lg bg-violet-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
