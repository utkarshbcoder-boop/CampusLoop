import type { Metadata } from "next";
import Link from "next/link";
import { MatchResultCard } from "@/components/cards";
import { MeProfileForm } from "@/components/MeProfileForm";
import { Callout, PageHeader, ScoreRing, Section, Stat, TagList } from "@/components/ui";
import { BoltIcon, ChartIcon, SparkIcon, TargetIcon } from "@/components/Icon";
import { DOMAIN_META, DOMAIN_WEIGHTS, ALL_DOMAINS } from "@/lib/matching/weights";
import { MATCH_ENGINE_VERSION, runMatch, summarise } from "@/lib/matching/engine";
import { headlineFor } from "@/lib/matching/signals";
import type { MatchDomain } from "@/lib/types";
import {
  sp,
  getColleges,
  getCurrentProfile,
  loadMatchContext,
  defaultPreferences,
  parsePreferences,
  type SearchParams,
} from "@/lib/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "AI Match Lab",
  description:
    "Live demo of the CampusLoop matching engine. Pick a domain and see ranked results with a full, itemised score breakdown across every weighted signal.",
};

const DOMAIN_HREFS: Record<string, string> = {
  teammate: "/teams",
  roommate: "/pg",
  skills: "/skills",
  items: "/books",
  services: "/services",
  events: "/events",
};

const DOMAIN_LABELS: Record<string, string> = {
  teammate: "Project teammates",
  roommate: "Rooms & roommates",
  skills: "Skills exchange",
  items: "Books & equipment",
  services: "Campus services",
  events: "Events",
};

export default async function MatchLabPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const profile = await getCurrentProfile();

  const requestedDomain = sp(params.domain);
  const domain = (ALL_DOMAINS as string[]).includes(requestedDomain) ? (requestedDomain as MatchDomain) : "teammate";

  const basePrefs = defaultPreferences(profile);
  const prefs = parsePreferences(params, basePrefs);

  const ctx = await loadMatchContext();
  const colleges = await getColleges();

  const matchCtx = {
    profile,
    colleges,
    prefs,
    listings: ctx.listings,
    equipment: ctx.equipment,
    pgListings: ctx.pgListings,
    teammatePosts: ctx.teammatePosts,
    skillProfiles: ctx.skillProfiles,
    profiles: ctx.profiles,
    services: ctx.services,
    events: ctx.events,
  };

  const all = runMatch(domain, matchCtx).sort((a, b) => b.score - a.score);
  const top = all.slice(0, 8);
  const stats = summarise(domain, all);

  const meta = DOMAIN_META[domain];
  const weights = DOMAIN_WEIGHTS[domain];
  const myCollege = colleges.find((c) => c.id === profile.college_id);

  const href = (id: string) => `${DOMAIN_HREFS[domain]}/${id}`;

  return (
    <>
      <PageHeader
        eyebrow={`Engine v${MATCH_ENGINE_VERSION} · deterministic, no API key`}
        title="The AI Match Lab"
        description="This is the real scoring function the product runs on every page — not a mock. Change a domain and watch every candidate re-rank, with each weighted signal itemised so you can argue with the score."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{stats.total_candidates}</p>
          <p className="text-[11px] text-white/45">candidates scored</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-mint-400">{stats.top_score}</p>
          <p className="text-[11px] text-white/45">top score</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <div className="cl-panel p-4">
          <p className="text-[11px] font-medium tracking-wide text-white/40 uppercase">Pick a matching domain</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ALL_DOMAINS.map((d) => {
              const active = d === domain;
              return (
                <Link
                  key={d}
                  href={`/match-lab?domain=${d}`}
                  className={active ? "cl-btn cl-btn-primary" : "cl-btn cl-btn-ghost"}
                >
                  <span aria-hidden>{DOMAIN_META[d].emoji}</span>
                  {DOMAIN_LABELS[d]}
                </Link>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-white/45">{meta.blurb}</p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            value={`${stats.average_score}`}
            label="Average score"
            sublabel={`Across ${stats.total_candidates} candidates`}
            icon={<TargetIcon width={20} height={20} />}
          />
          <Stat
            value={`${top.length ? top[0].score : 0}`}
            label="Best match"
            sublabel={top[0]?.title ?? "No candidates"}
            tone="mint"
            icon={<SparkIcon width={20} height={20} />}
          />
          <Stat
            value={`${Object.keys(weights).length}`}
            label="Domain"
            sublabel={DOMAIN_LABELS[domain]}
            tone="flare"
            icon={<BoltIcon width={20} height={20} />}
          />
          <Stat
            value={`${all.filter((r) => r.score >= 70).length}`}
            label="Strong matches"
            sublabel="Score of 70 or above"
            tone="rose"
            icon={<ChartIcon width={20} height={20} />}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="flex flex-col gap-4">
            {top.length === 0 ? (
              <div className="cl-panel p-6 text-sm text-white/50">
                No candidates in this domain yet. Try{" "}
                <Link href="/match-lab?domain=teammate" className="text-brand-300">
                  teammates
                </Link>{" "}
                — it has the densest seeded pool.
              </div>
            ) : (
              top.map((result, i) => (
                <MatchResultCard key={result.id} result={result} rank={i + 1} href={href(result.id)} />
              ))
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="cl-panel cl-panel-solid p-5">
              <h2 className="text-sm font-semibold text-white">Who you are right now</h2>
              <p className="mt-1 text-xs text-white/45">
                Scoring is done against this profile. Switch users from the header to compare.
              </p>
              <dl className="mt-4 flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs text-white/40">Student</dt>
                  <dd className="text-sm font-medium text-white">{profile.name}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs text-white/40">Campus</dt>
                  <dd className="text-sm font-medium text-white">{myCollege?.short_name ?? "—"}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs text-white/40">Year</dt>
                  <dd className="text-sm font-medium text-white">{profile.year_of_study}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs text-white/40">Credits</dt>
                  <dd className="text-sm font-medium text-white">{profile.credits}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs text-white/40">Rating</dt>
                  <dd className="text-sm font-medium text-white">{profile.rating.toFixed(1)}★</dd>
                </div>
              </dl>
              <div className="mt-5">
                <p className="text-[11px] font-medium tracking-wide text-white/40 uppercase">Your skills</p>
                <div className="mt-2">
                  <TagList tags={profile.skills} max={10} tone="brand" />
                </div>
              </div>
              <MeProfileForm
                defaults={{
                  name: profile.name,
                  college_id: profile.college_id,
                  year_of_study: profile.year_of_study,
                  credits: profile.credits,
                  rating: profile.rating,
                  skills: profile.skills,
                }}
              />
            </div>

            <div className="cl-panel p-5">
              <h2 className="text-sm font-semibold text-white">Weights in play</h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {(Object.entries(weights) as [string, number][]).map(([key, weight]) => (
                  <li key={key}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-white/60">{key.replace(/_/g, " ")}</span>
                      <span className="font-semibold text-white/80">{(weight * 100).toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-400"
                        style={{ width: `${weight * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/methodology" className="cl-btn cl-btn-ghost mt-4 w-full">
                How scoring works
              </Link>
            </div>

            {top[0] ? (
              <div className="cl-panel p-5">
                <div className="flex items-center gap-3">
                  <ScoreRing score={top[0].score} size={56} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Top match explained</p>
                    <p className="mt-0.5 truncate text-xs text-white/45">{top[0].title}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/55">
                  {top[0].headline || headlineFor(top[0].breakdown)}
                </p>
              </div>
            ) : null}
          </aside>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Callout title="Why this is not a black box" tone="brand" icon={<ChartIcon width={18} height={18} />}>
            Every score is a weighted sum of normalised signals. No model weights, no API call, no randomness — the same
            profile and preferences always produce the same ranking, which is exactly what you want when you are explaining a
            match to a user.{" "}
            <Link href="/methodology" className="text-brand-300">
              Full methodology
            </Link>
            .
          </Callout>
          <Callout title="What it costs to run" tone="mint">
            Zero. The scorer is pure TypeScript running on the server, so matching has no marginal cost per student. That is
            why the free tier can include unlimited matching while charging only for transaction-side features.
          </Callout>
        </div>
      </Section>
    </>
  );
}