import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader, ScoreBreakdown, Section } from "@/components/ui";
import { ChartIcon, ShieldIcon, SparkIcon } from "@/components/Icon";
import { ALL_DOMAINS, DOMAIN_META, DOMAIN_WEIGHTS } from "@/lib/matching/weights";
import { MATCH_ENGINE_VERSION, runMatch, summarise } from "@/lib/matching/engine";
import { getColleges, getCurrentProfile, loadMatchContext, defaultPreferences } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Matching Methodology",
  description:
    "Exactly how CampusLoop scores a match: the shared signal primitives, the per-domain weights, and a live worked example with the full score breakdown.",
};

export default async function MethodologyPage() {
  const profile = await getCurrentProfile();
  const colleges = await getColleges();
  const ctx = await loadMatchContext();

  const matchCtx = {
    profile,
    colleges,
    prefs: defaultPreferences(profile),
    listings: ctx.listings,
    equipment: ctx.equipment,
    pgListings: ctx.pgListings,
    teammatePosts: ctx.teammatePosts,
    skillProfiles: ctx.skillProfiles,
    profiles: ctx.profiles,
    services: ctx.services,
    events: ctx.events,
  };

  const example = runMatch("teammate", matchCtx).sort((a, b) => b.score - a.score)[0];
  const stats = summarise("teammate", runMatch("teammate", matchCtx));

  const weightSum = (domain: (typeof ALL_DOMAINS)[number]) =>
    Object.values(DOMAIN_WEIGHTS[domain]).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader
        eyebrow={`Engine v${MATCH_ENGINE_VERSION}`}
        title="How the matching actually works"
        description="No LLM in the hot path, no black box, no random seed. Every score is a weighted sum of normalised signals, which means it is reproducible, explainable to a user, and free to run at campus scale."
      />

      <Section className="pt-6">
        <div className="cl-panel cl-panel-solid p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">The formula</h2>
          <div className="mt-5 overflow-x-auto">
            <p className="font-mono text-sm whitespace-nowrap text-white/80">
              score = round( <span className="text-brand-300">100 × Σ</span>{" "}
              <span className="text-white/35">( w<sub>i</sub> × s<sub>i</sub> )</span> )
            </p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">s — signal</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                A raw 0–1 number from a named primitive. Skill overlap, budget fit, distance decay, availability overlap,
                trust score. Never a mystery.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">w — weight</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                How much that signal matters for this domain, set once in{" "}
                <code className="text-brand-300">src/lib/matching/weights.ts</code> and normalised to sum to 1.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">contribution</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                What this signal actually added to the final number. Shown on every card, so a user can see that a 92 came
                mostly from skill fit and barely from campus proximity.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Callout title="Reproducible by construction" tone="mint" icon={<ShieldIcon width={18} height={18} />}>
            No randomness, no clock-dependent tie-breaks, no model sampling. The same profile plus the same preferences
            gives the same ranking forever, so a student who sees score 84 today still sees it tomorrow.
          </Callout>
          <Callout title="Explainable by design" tone="brand" icon={<ChartIcon width={18} height={18} />}>
            Every result carries its full breakdown. When a student asks &ldquo;why is this roommate ranked first?&rdquo;, the
            product can answer with numbers instead of a shrug.
          </Callout>
          <Callout title="Free to run" tone="flare" icon={<SparkIcon width={18} height={18} />}>
            Pure TypeScript on the server. Zero marginal cost per student, which is what lets the free tier include unlimited
            matching.
          </Callout>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">The primitives</h2>
          <p className="mt-2 text-sm text-white/50">
            Six reusable signal functions in <code className="text-brand-300">src/lib/matching/signals.ts</code> do all the
            actual work. Every domain is a different weighting of these.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "coverage",
                body: "What share of the skills they need do you already have. This is the main driver of teammate matches.",
              },
              {
                name: "jaccard",
                body: "Size of the shared set over the size of the union. Used for interest and interest overlap, so a person with 40 interests does not win every comparison.",
              },
              {
                name: "intervalFit",
                body: "Is your budget inside their range, with a soft tolerance band so ₹6,500 against a ₹6,000 ask is nearly a perfect fit.",
              },
              {
                name: "distanceDecay",
                body: "Exponential falloff in kilometres. 200m and 2km are very different for a roommate; 2km and 20km are both &ldquo;too far&rdquo;.",
              },
              {
                name: "slotOverlap",
                body: "Do your free windows actually intersect the build window they published.",
              },
              {
                name: "trust",
                body: "Bayer-weighted rating over review count, plus transaction volume and verification depth. A 5.0 from one person does not outrank a 4.7 from forty.",
              },
            ].map((p) => (
              <div key={p.name} className="cl-panel p-5">
                <code className="text-sm font-semibold text-brand-300">{p.name}()</code>
                <p className="mt-2 text-xs leading-relaxed text-white/55">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Weights by domain</h2>
          <p className="mt-2 text-sm text-white/50">Each column sums to 100%.</p>
          <div className="mt-6 overflow-x-auto">
            <div className="cl-panel overflow-hidden">
              <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] tracking-wider text-white/35 uppercase">
                    <th className="px-4 py-3 font-semibold">Domain</th>
                    <th className="px-4 py-3 font-semibold">Signals, weighted</th>
                    <th className="px-4 py-3 text-right font-semibold">Candidates</th>
                    <th className="px-4 py-3 text-right font-semibold">Sums to</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_DOMAINS.map((d) => {
                    const meta = DOMAIN_META[d];
                    return (
                      <tr key={d} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 font-medium text-white">
                            <span aria-hidden>{meta.emoji}</span>
                            {meta.title}
                          </span>
                          <span className="mt-0.5 block max-w-sm text-xs text-white/35">{meta.blurb}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/55">
                          {Object.entries(DOMAIN_WEIGHTS[d])
                            .sort((a, b) => b[1] - a[1])
                            .map(([k, v]) => `${k.replace(/_/g, " ")} ${(v * 100).toFixed(0)}%`)
                            .join(" · ")}
                        </td>
                        <td className="px-4 py-3 text-right text-white/70">
                          {runMatch(d, matchCtx).length}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-mint-400">
                          {(weightSum(d) * 100).toFixed(0)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">A worked example, live</h2>
          <p className="mt-2 text-sm text-white/50">
            Top teammate match for the signed-in profile, computed just now. {stats.total_candidates} candidates were scored;
            the winner took {stats.top_score}.
          </p>
          {example ? (
            <div className="mt-6 cl-panel cl-panel-solid p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white">{example.title}</h3>
                  <p className="mt-1 text-xs text-white/45">{example.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black tracking-tight text-white">{example.score}</p>
                  <p className="text-[10px] tracking-wider text-white/35 uppercase">out of 100</p>
                </div>
              </div>
              <div className="mt-6 border-t border-white/8 pt-6">
                <ScoreBreakdown breakdown={example.breakdown} />
              </div>
            </div>
          ) : (
            <p className="mt-6 cl-panel p-5 text-sm text-white/50">No teammate posts in the seeded data.</p>
          )}
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Callout title="Where an LLM would help — and where it would not" tone="brand">
            An LLM is genuinely better at reading a messy free-text project description and inferring the skills implied. That
            is exactly what the optional{" "}
            <code className="text-brand-300">src/lib/matching/enrichment.ts</code> path is for — it adds one sentence of
            reasoning when an API key is present. It never touches the score, because a model-generated number is
            impossible to explain, reproduce or debug when a student disputes a match.
          </Callout>
          <Callout title="Known limitations" tone="flare">
            <span className="block">
              1. Cold start — a new student with no skill history scores low everywhere until they complete a profile.
            </span>
            <span className="mt-2 block">
              2. Bus-factor bias — a single popular senior dominates roommate and teammate pools because reputation compounds.
            </span>
            <span className="mt-2 block">
              3. Verification is self-reported until the transaction happens. That is the honest gap to close next.
            </span>
          </Callout>
        </div>

        <div className="mt-10 cl-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/60">
            Move the profile, change a domain and watch it re-score. That is the demo judges should interrupt on.
          </p>
          <Link href="/match-lab" className="cl-btn cl-btn-primary shrink-0">
            Open the Match Lab
          </Link>
        </div>
      </Section>
    </>
  );
}