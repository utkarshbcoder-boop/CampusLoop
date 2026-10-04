import type { Metadata } from "next";
import Link from "next/link";
import { SparkIcon, UsersIcon } from "@/components/Icon";
import { ActiveFilters, FilterBar, type FilterDef } from "@/components/FilterBar";
import { TeammateCard } from "@/components/cards";
import { EmptyState, PageHeader, Section } from "@/components/ui";
import { rupeesShort } from "@/lib/format";
import { getColleges, getTeammatePosts, getCurrentProfile, parseTeamFilters, type SearchParams } from "@/lib/queries";
import { getDataProvider } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Project Teammates",
  description:
    "Find hackathon and project teammates by skill complement, not by whoever replies first. Ranked by an explainable match score.",
};

const TYPES = [
  { value: "all", label: "All projects" },
  { value: "hackathon", label: "Hackathons" },
  { value: "startup", label: "Startups" },
  { value: "course_project", label: "Course projects" },
  { value: "research", label: "Research" },
  { value: "competition", label: "Competitions" },
];

const TIERS = [
  { value: "all", label: "Any tier" },
  { value: "national", label: "National" },
  { value: "state", label: "State" },
  { value: "college", label: "College" },
  { value: "internal", label: "Internal" },
];

const MODES = [
  { value: "all", label: "Any mode" },
  { value: "on_campus", label: "On campus" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

const SORTS = [
  { value: "recent", label: "Newest" },
  { value: "prize", label: "Biggest prize pool" },
  { value: "applicants", label: "Most applicants" },
  { value: "views", label: "Most viewed" },
  { value: "weeks", label: "Shortest timeline" },
];

export default async function TeamsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseTeamFilters(params);
  const [posts, colleges, profile] = await Promise.all([getTeammatePosts(filters), getColleges(), getCurrentProfile()]);

  const provider = await getDataProvider();
  const profiles = await provider.profiles.list();
  const ownerById = new Map(profiles.map((p) => [p.id, p]));

  const barFilters: FilterDef[] = [
    { kind: "select", key: "type", label: "Project type", defaultValue: "all", options: TYPES },
    { kind: "select", key: "tier", label: "Hackathon tier", defaultValue: "all", options: TIERS },
    { kind: "select", key: "mode", label: "Working mode", defaultValue: "all", options: MODES },
    { kind: "select", key: "sort", label: "Sort by", defaultValue: "recent", options: SORTS },
  ];

  const activeLabels = [
    filters.q ? { key: "q", label: `“${filters.q}”` } : null,
    filters.type !== "all" ? { key: "type", label: TYPES.find((t) => t.value === filters.type)?.label ?? filters.type } : null,
    filters.tier !== "all" ? { key: "tier", label: TIERS.find((t) => t.value === filters.tier)?.label ?? filters.tier } : null,
    filters.mode !== "all" ? { key: "mode", label: MODES.find((m) => m.value === filters.mode)?.label ?? filters.mode } : null,
  ].filter((x): x is { key: string; label: string } => Boolean(x));

  const openSpots = posts.reduce(
    (a, p) => a + Math.max(0, p.roles_needed.reduce((x, r) => x + r.count, 0) - p.filled_count),
    0,
  );
  const totalPrize = posts.reduce((a, p) => a + p.prize_pool, 0);

  return (
    <>
      <PageHeader
        eyebrow="Module 04 · Project teammates"
        title="Find the backend person your hackathon team is missing"
        description="Posts list the roles they still need and the skills each role requires. CampusLoop ranks them for your actual skill set, so the top result is the team that is genuinely missing what you can do — not the one that posted first."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{openSpots}</p>
          <p className="text-[11px] text-white/45">spots still open</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{rupeesShort(totalPrize)}</p>
          <p className="text-[11px] text-white/45">total prize money listed</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <div className="flex flex-col gap-3">
          <FilterBar
            filters={barFilters}
            placeholder="Search a project — “agri”, “blockchain”, “drone”…"
            resultLabel={`${posts.length} ${posts.length === 1 ? "team" : "teams"} recruiting`}
          />
          <ActiveFilters labels={activeLabels} />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            Showing posts for {colleges.find((c) => c.id === profile.college_id)?.short_name} first — same-campus teams
            meet in five minutes.
          </p>
          <Link href="/skills" className="cl-btn cl-btn-primary">
            <SparkIcon width={15} height={15} />
            Exchange skills with teammates
          </Link>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            title="No teams recruiting right now"
            description="Hackathon season is lumpy. Clear the filters to see everything, or post your own team — it takes one form and about forty seconds."
            action={
              <Link href="/teams" className="cl-btn cl-btn-primary">
                <UsersIcon width={15} height={15} />
                Show all teams
              </Link>
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <TeammateCard
                key={post.id}
                post={post}
                colleges={colleges}
                owner={ownerById.get(post.owner_id)}
              />
            ))}
          </div>
        )}

        <div className="mt-10 cl-panel p-5">
          <h2 className="text-sm font-semibold text-white">What the engine actually measures</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Skill complement (30%) is the share of their missing roles your verified skills already cover. Availability
            overlap (16%) compares your free slots against their build windows. Commitment fit (14%) checks whether the
            hours they want match the hours you actually have. Interest overlap (13%) is a surprisingly good predictor of
            whether you will still be committed three weeks in. Campus proximity (10%), reputation (10%) and verification
            (7%) finish it. You see every one of those numbers on the post page.
          </p>
        </div>
      </Section>
    </>
  );
}
