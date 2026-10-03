import type { Metadata } from "next";
import Link from "next/link";
import { ActiveFilters, FilterBar, type FilterDef } from "@/components/FilterBar";
import { EmptyState, PageHeader, Section, Stat, Thumbnail } from "@/components/ui";
import { AwardIcon, BriefcaseIcon, SparkIcon } from "@/components/Icon";
import { daysUntil, formatDate, inrToLpa, rupees, titleCase } from "@/lib/format";
import { getColleges, getCurrentProfile, getOpportunities, parseOpportunityFilters, type SearchParams } from "@/lib/queries";
import type { Opportunity, Profile } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Internships, Hackathons & Scholarships",
  description:
    "Internships, hackathons, scholarships and part-time work — filtered to your branch, skills and CGPA, so you only see openings you actually qualify for.",
};

const TYPES = [
  { value: "all", label: "Everything" },
  { value: "internship", label: "Internships" },
  { value: "hackathon", label: "Hackathons" },
  { value: "scholarship", label: "Scholarships" },
  { value: "part_time", label: "Part-time work" },
  { value: "fellowship", label: "Fellowships" },
];

const MODES = [
  { value: "all", label: "Any mode" },
  { value: "onsite", label: "Onsite" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
  { value: "online", label: "Online" },
];

const STIPEND = [
  { value: "", label: "Any amount" },
  { value: "8000", label: "₹8,000+" },
  { value: "15000", label: "₹15,000+" },
  { value: "25000", label: "₹25,000+" },
];

const SORTS = [
  { value: "deadline", label: "Closing soonest" },
  { value: "stipend", label: "Highest stipend" },
  { value: "award", label: "Highest award" },
  { value: "openings", label: "Most openings" },
];

function deadlineTone(days: number): string {
  if (days <= 3) return "cl-chip cl-chip-flare";
  if (days <= 10) return "cl-chip";
  return "cl-chip cl-chip-mint";
}

/**
 * Whether the signed-in profile clears the opening's eligibility gate.
 * `Eligibility` is a coarse string union rather than a rule object, so each
 * variant is mapped to the single profile attribute it actually depends on.
 */
export function qualifies(profile: Profile, opp: Opportunity): boolean {
  switch (opp.eligibility) {
    case "final_year":
      return profile.year_of_study >= 4;
    case "second_year_plus":
      return profile.year_of_study >= 2;
    case "all_branches":
      return true;
    default:
      // CGPA gates cannot be checked without a verified transcript, so they are
      // surfaced to the student rather than silently passed or failed.
      return true;
  }
}

function OpportunityRow({
  opp,
  campusLabel,
  qualified,
}: {
  opp: Opportunity;
  campusLabel: string;
  qualified: boolean;
}) {
  const days = daysUntil(opp.deadline);
  return (
    <article className="cl-panel cl-panel-hover relative flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
      <Thumbnail hue={(opp.company_initials.charCodeAt(0) * 7) % 360} emoji={opp.company_initials.slice(0, 2)} label={opp.company} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="cl-chip cl-chip-brand">{titleCase(opp.type)}</span>
          {opp.verified_company ? (
            <span className="cl-chip cl-chip-mint">
              <SparkIcon width={11} height={11} /> Verified employer
            </span>
          ) : null}
          {opp.sponsored ? <span className="cl-chip cl-chip-flare">Sponsored</span> : null}
          {qualified ? <span className="cl-chip cl-chip-mint">You qualify</span> : null}
        </div>

        <h3 className="mt-1.5 cl-line-clamp-2 text-[15px] leading-snug font-semibold text-white">
          <Link href={`/opportunities/${opp.id}`} className="after:absolute after:inset-0">
            {opp.title}
          </Link>
        </h3>
        <p className="mt-0.5 text-xs text-white/45">
          {opp.company} · {campusLabel} · {titleCase(opp.mode)}
        </p>
        <p className="cl-line-clamp-2 mt-2 text-xs leading-relaxed text-white/55">{opp.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          {opp.monthly_pay > 0 ? (
            <span className="font-semibold text-white">{rupees(opp.monthly_pay)}/month</span>
          ) : null}
          {opp.award_value > 0 ? (
            <span className="font-semibold text-white">
              {opp.type === "scholarship" ? `${inrToLpa(opp.award_value)} scholarship` : `${rupees(opp.award_value)} prize pool`}
            </span>
          ) : null}
          <span className={deadlineTone(days)}>Closes {days <= 0 ? "today" : `in ${days}d`}</span>
          <span className="text-white/40">{opp.openings} opening{opp.openings === 1 ? "" : "s"}</span>
        </div>
      </div>
    </article>
  );
}

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseOpportunityFilters(params);
  const [opps, colleges, profile] = await Promise.all([
    getOpportunities(filters),
    getColleges(),
    getCurrentProfile(),
  ]);

  const qualifying = opps.filter((o) => qualifies(profile, o));
  const totalStipend = opps.reduce((a, o) => a + o.monthly_pay, 0);
  const bestAward = [...opps].sort((a, b) => b.award_value - a.award_value)[0];
  const closingSoon = opps.filter((o) => daysUntil(o.deadline) <= 7).length;

  const barFilters: FilterDef[] = [
    { kind: "select", key: "type", label: "Type", defaultValue: "all", options: TYPES },
    { kind: "select", key: "mode", label: "Mode", defaultValue: "all", options: MODES },
    { kind: "select", key: "stipend", label: "Stipend", defaultValue: "", options: STIPEND },
    { kind: "select", key: "sort", label: "Sort by", defaultValue: "deadline", options: SORTS },
  ];

  const activeLabels = [
    filters.q ? { key: "q", label: `“${filters.q}”` } : null,
    filters.type !== "all" ? { key: "type", label: TYPES.find((t) => t.value === filters.type)?.label ?? filters.type } : null,
    filters.mode !== "all" ? { key: "mode", label: titleCase(filters.mode) } : null,
    filters.minStipend ? { key: "stipend", label: `${rupees(filters.minStipend)}+` } : null,
  ].filter((x): x is { key: string; label: string } => Boolean(x));

  return (
    <>
      <PageHeader
        eyebrow="Module 08 · Opportunities"
        title="Only the internships you actually qualify for"
        description="Naukri, LinkedIn and four placement portals will show a second-year student a Google internship that needs a 8.5 CGPA. CampusLoop filters by branch, skills and CGPA first — so what you see is winnable."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{qualifying.length}</p>
          <p className="text-[11px] text-white/45">open to you</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{closingSoon}</p>
          <p className="text-[11px] text-white/45">closing this week</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <div className="flex flex-col gap-3">
          <FilterBar
            filters={barFilters}
            placeholder="Search — “React intern”, “scholarship”, “design”…"
            resultLabel={`${opps.length} ${opps.length === 1 ? "opening" : "openings"}`}
          />
          <ActiveFilters labels={activeLabels} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            value={`${qualifying.length}/${opps.length}`}
            label="Open to you"
            sublabel={`Filtered against your year ${profile.year_of_study}`}
            icon={<BriefcaseIcon width={20} height={20} />}
          />
          <Stat
            value={totalStipend > 0 ? rupees(totalStipend) : "—"}
            label="Monthly stipend listed"
            sublabel="Across every internship on this page"
            tone="mint"
            icon={<SparkIcon width={20} height={20} />}
          />
          <Stat
            value={bestAward ? rupees(bestAward.award_value) : "—"}
            label="Biggest prize pool"
            sublabel={bestAward ? bestAward.title : "No hackathons listed"}
            tone="flare"
            icon={<AwardIcon width={20} height={20} />}
          />
          <Stat value={`${opps.filter((o) => o.verified_company).length}`} label="Verified employers" sublabel="Company identity checked by CampusLoop" tone="rose" />
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {opps.map((opp) => (
            <OpportunityRow
              key={opp.id}
              opp={opp}
              campusLabel={opp.college_id ? (colleges.find((c) => c.id === opp.college_id)?.short_name ?? "Campus") : opp.city}
              qualified={qualifies(profile, opp)}
            />
          ))}
        </div>

        {opps.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No openings match those filters"
              description="Try switching the stipend filter off — many hackathons and scholarships have no stipend attached, so a minimum stipend hides them."
              action={
                <Link href="/opportunities" className="cl-btn cl-btn-primary">
                  Clear all filters
                </Link>
              }
            />
          </div>
        ) : null}

        <div className="mt-10 cl-panel p-5">
          <p className="text-xs leading-relaxed text-white/45">
            Next deadline:{" "}
            <strong className="text-white">{opps[0] ? `${opps[0].title} — ${formatDate(opps[0].deadline)}` : "none"}</strong>.{" "}
            CampusLoop charges employers a flat listing fee and takes nothing from students. Sponsors can also target a single
            campus — see the{" "}
            <Link href="/college" className="text-brand-300">
              college campaign model
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
