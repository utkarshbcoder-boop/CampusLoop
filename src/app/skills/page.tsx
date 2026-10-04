import type { Metadata } from "next";
import Link from "next/link";
import { SparkIcon, TargetIcon } from "@/components/Icon";
import { ActiveFilters, FilterBar, type FilterDef } from "@/components/FilterBar";
import { SkillCard } from "@/components/cards";
import { EmptyState, PageHeader, Section } from "@/components/ui";
import { getColleges, getCurrentProfile, getSkillProfiles, parseSkillFilters, type SearchParams } from "@/lib/queries";
import { getDataProvider } from "@/lib/db";
import { SKILLS, skillsByDomain } from "@/lib/data/taxonomy";
import { skillLabel } from "@/lib/data/taxonomy";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Skills Exchange",
  description:
    "Time banking on campus: teach what you know, learn what you need, and pay in credits instead of money. Matched bidirectionally by skill complement.",
};

const KINDS = [
  { value: "all", label: "Teach & learn" },
  { value: "teach", label: "Offering to teach" },
  { value: "learn", label: "Looking to learn" },
];

const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "coding", label: "Coding" },
  { value: "data_science", label: "Data science" },
  { value: "design", label: "Design" },
  { value: "academics", label: "Academics" },
  { value: "communication", label: "Communication" },
  { value: "hardware", label: "Hardware" },
  { value: "business", label: "Business" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "language", label: "Language" },
];

const SORTS = [
  { value: "rating", label: "Highest rated" },
  { value: "sessions", label: "Most sessions completed" },
  { value: "cheapest", label: "Fewest credits" },
  { value: "newest", label: "Recently added" },
];

export default async function SkillsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseSkillFilters(params);
  const [skills, colleges, profile] = await Promise.all([getSkillProfiles(filters), getColleges(), getCurrentProfile()]);

  const provider = await getDataProvider();
  const profiles = await provider.profiles.list();
  const ownerById = new Map(profiles.map((p) => [p.id, p]));

  const barFilters: FilterDef[] = [
    { kind: "select", key: "kind", label: "Direction", defaultValue: "all", options: KINDS },
    { kind: "select", key: "category", label: "Category", defaultValue: "all", options: CATEGORIES },
    { kind: "select", key: "sort", label: "Sort by", defaultValue: "rating", options: SORTS },
  ];

  const activeLabels = [
    filters.q ? { key: "q", label: `“${filters.q}”` } : null,
    filters.kind !== "all" ? { key: "kind", label: KINDS.find((k) => k.value === filters.kind)?.label ?? filters.kind } : null,
    filters.category !== "all"
      ? { key: "category", label: CATEGORIES.find((c) => c.value === filters.category)?.label ?? filters.category }
      : null,
  ].filter((x): x is { key: string; label: string } => Boolean(x));

  const sessions = skills.reduce((a, s) => a + s.sessions_completed, 0);

  return (
    <>
      <PageHeader
        eyebrow="Module 05 · Skills exchange"
        title="Trade an hour of Excel for an hour of React"
        description="Time banking, not a marketplace. One credit is one hour of teaching, earned by a final-year student and spent by a first-year who needs the same help. Credits are deducted only when both sides confirm the session happened."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{skills.length}</p>
          <p className="text-[11px] text-white/45">open offers</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{sessions}</p>
          <p className="text-[11px] text-white/45">sessions completed</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <div className="flex flex-col gap-3">
          <FilterBar
            filters={barFilters}
            placeholder="Search a skill — “React”, “MATLAB”, “public speaking”…"
            resultLabel={`${skills.length} ${skills.length === 1 ? "offer" : "offers"}`}
          />
          <ActiveFilters labels={activeLabels} />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            You have <span className="font-semibold text-flare-300">{profile.credits} credits</span> to spend.
          </p>
          <Link href="/teams" className="cl-btn cl-btn-primary">
            <SparkIcon width={15} height={15} />
            Find teammates with my skills
          </Link>
        </div>

        {skills.length === 0 ? (
          <EmptyState
            title="No offers match that filter"
            description="The exchange is younger than the other modules, so it is thinner. If nobody on your campus teaches what you need, that is a gap you can fill and be paid in credits for."
            action={
              <Link href="/skills" className="cl-btn cl-btn-primary">
                <TargetIcon width={15} height={15} />
                Show all offers
              </Link>
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} owner={ownerById.get(skill.owner_id)} colleges={colleges} />
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="cl-panel p-5">
            <h2 className="text-sm font-semibold text-white">How credits work</h2>
            <ol className="mt-3 flex flex-col gap-2.5 text-xs text-white/60">
              {[
                "A final-year student offers “Excel for placement prep” at 1 credit per session.",
                "You request a session; nothing is deducted yet.",
                "After the session, both sides confirm it happened. Only then are credits deducted.",
                "Teaching earns credits. Over a semester that is 8–12 credits, enough for the sessions you need.",
              ].map((step, i) => (
                <li key={step} className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-200">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="cl-panel p-5">
            <h2 className="text-sm font-semibold text-white">Skills students actually want</h2>
            <p className="mt-1 text-xs text-white/45">Across {SKILLS.length} taxonomy terms on the platform.</p>
            <div className="mt-4 flex flex-col gap-3">
              {(["tech", "data", "design", "core"] as const).map((domain) => (
                <div key={domain}>
                  <p className="text-[10px] tracking-wider text-white/40 uppercase">{domain}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {skillsByDomain(domain)
                      .slice(0, 6)
                      .map((s) => (
                        <span key={s.slug} className="cl-chip">
                          {s.label}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-white/40">
              {profile.seeking_skills.length > 0
                ? `You are looking for ${profile.seeking_skills.map(skillLabel).join(", ")}.`
                : "Add what you want to learn and the engine will find people who teach it."}
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
