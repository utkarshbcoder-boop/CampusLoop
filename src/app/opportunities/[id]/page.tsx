import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyButton, SaveButton } from "@/components/Actions";
import { Callout, PageHeader, Section, TagList, Thumbnail } from "@/components/ui";
import { AwardIcon, BriefcaseIcon, CheckIcon, ClockIcon, PinIcon, SparkIcon } from "@/components/Icon";
import { daysUntil, formatDate, inrToLpa, rupees, titleCase } from "@/lib/format";
import { getColleges, getCurrentProfile, getOpportunities, getOpportunity } from "@/lib/queries";
import type { Opportunity } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) return { title: "Opening not found" };
  return { title: opp.title, description: `${opp.title} at ${opp.company}. Closes ${formatDate(opp.deadline)}.` };
}

function EligibilityRow({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          ok ? "bg-mint-500/20 text-mint-400" : "bg-rose-500/20 text-rose-400"
        }`}
        aria-hidden
      >
        <CheckIcon width={10} height={10} className={ok ? "" : "rotate-45"} />
      </span>
      <span className={ok ? "text-white/80" : "text-white/40"}>
        <span className="font-medium">{label}:</span> {value}
        {!ok ? <span className="ml-1 text-rose-400">(you do not meet this yet)</span> : null}
      </span>
    </li>
  );
}

const ELIGIBILITY_COPY: Record<Opportunity["eligibility"], string> = {
  all_branches: "Open to every branch",
  cgpa_8_plus: "CGPA 8.0 and above",
  cgpa_7_plus: "CGPA 7.0 and above",
  final_year: "Final-year students only",
  second_year_plus: "Second year and above",
};

function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <article className="cl-panel cl-panel-hover relative flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="cl-chip cl-chip-brand">{titleCase(opp.type)}</span>
        {opp.verified_company ? <span className="cl-chip cl-chip-mint">Verified</span> : null}
      </div>
      <h3 className="cl-line-clamp-2 text-sm leading-snug font-semibold text-white">
        <Link href={`/opportunities/${opp.id}`} className="after:absolute after:inset-0">
          {opp.title}
        </Link>
      </h3>
      <p className="text-xs text-white/45">
        {opp.company} · {titleCase(opp.mode)} · {opp.openings} opening{opp.openings === 1 ? "" : "s"}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {opp.monthly_pay > 0 ? <span className="font-semibold text-white">{rupees(opp.monthly_pay)}/mo</span> : null}
        {opp.award_value > 0 ? <span className="font-semibold text-white">{rupees(opp.award_value)}</span> : null}
        <span className="text-white/40">Closes {formatDate(opp.deadline)}</span>
      </div>
    </article>
  );
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [opp, colleges, profile] = await Promise.all([getOpportunity(id), getColleges(), getCurrentProfile()]);
  if (!opp) notFound();

  const days = daysUntil(opp.deadline);
  const campusLabel = opp.college_id ? colleges.find((c) => c.id === opp.college_id)?.short_name : null;
  const yearOk = opp.eligibility === "all_branches" || opp.eligibility === "cgpa_7_plus" || opp.eligibility === "cgpa_8_plus"
    ? true
    : opp.eligibility === "final_year"
      ? profile.year_of_study >= 4
      : profile.year_of_study >= 2;

  const related = (
    await getOpportunities({ q: "", type: opp.type, mode: "all", minStipend: null, sort: "deadline" })
  )
    .filter((o) => o.id !== opp.id)
    .slice(0, 3);

  return (
    <>
      <PageHeader eyebrow={titleCase(opp.type)} title={opp.title} description={opp.description}>
        <SaveButton id={opp.id} label="Save" />
      </PageHeader>

      <Section className="pt-6">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
          <Link href="/opportunities" className="transition hover:text-white">
            Opportunities
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-white/70">{opp.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-6">
            <div className="cl-panel cl-panel-solid p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Thumbnail
                  hue={(opp.company_initials.charCodeAt(0) * 7) % 360}
                  emoji={opp.company_initials.slice(0, 2)}
                  label={opp.company}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{opp.company}</p>
                  <p className="mt-0.5 text-xs text-white/45">
                    <PinIcon width={12} height={12} className="mr-1 inline align-[-1px]" />
                    {campusLabel ? `${campusLabel} campus` : opp.city} · {titleCase(opp.mode)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                {opp.monthly_pay > 0 ? (
                  <div>
                    <p className="text-3xl font-black tracking-tight text-white">{rupees(opp.monthly_pay)}</p>
                    <p className="text-[11px] text-white/40">per month</p>
                  </div>
                ) : null}
                {opp.award_value > 0 ? (
                  <div>
                    <p className="text-3xl font-black tracking-tight text-white">{rupees(opp.award_value)}</p>
                    <p className="text-[11px] text-white/40">
                      {opp.type === "scholarship" ? inrToLpa(opp.award_value) : "prize pool"}
                    </p>
                  </div>
                ) : null}
                <div>
                  <p className="text-3xl font-black tracking-tight text-white">{opp.openings}</p>
                  <p className="text-[11px] text-white/40">openings</p>
                </div>
                <div>
                  <p className={`text-3xl font-black tracking-tight ${days <= 3 ? "text-flare-300" : "text-white"}`}>
                    {days <= 0 ? "Today" : `${days}d`}
                  </p>
                  <p className="text-[11px] text-white/40">to deadline</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-1.5">
                {opp.verified_company ? (
                  <span className="cl-chip cl-chip-mint">
                    <SparkIcon width={11} height={11} /> Verified employer
                  </span>
                ) : null}
                {opp.sponsored ? <span className="cl-chip cl-chip-flare">Sponsored</span> : null}
                {yearOk ? <span className="cl-chip cl-chip-mint">Open to you</span> : null}
              </div>
            </div>

            <div className="cl-panel p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white">Skills they are looking for</h2>
              <div className="mt-3">
                <TagList tags={opp.skills} max={16} tone="brand" />
              </div>
              <p className="mt-3 text-xs text-white/45">
                CampusLoop cross-references this list against your profile from the skills exchange — if you can already do
                two of these, you can trade them for coaching on the rest.{" "}
                <Link href="/skills" className="text-brand-300">
                  Browse the skills exchange
                </Link>
                .
              </p>
            </div>

            <div className="cl-panel p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white">Who can apply</h2>
              <ul className="mt-4 flex flex-col gap-3">
                <EligibilityRow label="Eligibility" ok value={ELIGIBILITY_COPY[opp.eligibility]} />
                <EligibilityRow label="Minimum CGPA" ok={opp.min_cgpa === null} value={opp.min_cgpa === null ? "No cut-off listed" : `${opp.min_cgpa.toFixed(1)}+`} />
                <EligibilityRow label="Year of study" ok={yearOk} value={`You are in year ${profile.year_of_study}`} />
                <EligibilityRow label="Branch" ok value={`${titleCase(profile.branch)} students welcome`} />
              </ul>
            </div>

            <div className="cl-panel p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white">About this opening</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{opp.description}</p>
              <div className="mt-4">
                <TagList tags={opp.tags} max={10} tone="plain" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="cl-panel cl-panel-solid p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white">Apply</h2>
              <p className="mt-1.5 text-xs text-white/45">
                Closes {formatDate(opp.deadline)} · {opp.applicants} students have applied so far.
              </p>
              <div className="mt-4">
                <ApplyButton postId={opp.id} postTitle={opp.title} role={titleCase(opp.type)} />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-white/40">
                {opp.verified_company
                  ? "CampusLoop has verified this company’s registration and point-of-contact before the listing went live."
                  : "This listing is not company-verified yet. CampusLoop marks the difference rather than hiding it."}
              </p>
            </div>

            <div className="cl-panel p-5">
              <div className="flex items-start gap-3">
                <ClockIcon width={18} height={18} className="mt-0.5 shrink-0 text-flare-400" />
                <p className="text-xs leading-relaxed text-white/55">
                  Posted {formatDate(opp.posted_at)}.{" "}
                  {opp.sponsored
                    ? "This is a sponsored listing — the employer paid for campus targeting. The stipend and eligibility are still verified."
                    : "Not sponsored. It ranked here on merit, not budget."}
                </p>
              </div>
            </div>

            <div className="cl-panel p-5">
              <div className="flex items-start gap-3">
                <AwardIcon width={18} height={18} className="mt-0.5 shrink-0 text-brand-300" />
                <p className="text-xs leading-relaxed text-white/55">
                  Building the skill this opening asks for takes longer than the deadline.{" "}
                  <Link href="/match-lab" className="text-brand-300">
                    Run it through the Match Lab
                  </Link>{" "}
                  to see how close you already are.
                </p>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 ? (
          <div className="mt-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  More {titleCase(opp.type)} openings
                </h2>
                <p className="mt-1.5 text-sm text-white/50">Same category, closing soonest first.</p>
              </div>
              <Link href="/opportunities" className="cl-btn cl-btn-ghost shrink-0">
                All openings
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((o) => (
                <OpportunityCard key={o.id} opp={o} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Callout title="Recruiting on campus?" tone="brand" icon={<BriefcaseIcon width={18} height={18} />}>
            Post an opening that reaches verified students at a specific college, filtered to the branches and years you
            actually want. Flat listing fee, no applicant spam.{" "}
            <Link href="/business" className="text-brand-300">
              See employer pricing
            </Link>
            .
          </Callout>
          <Callout title="Everything on one profile" tone="mint">
            Your CampusLoop profile already carries your skills, credits and project history — so applying is one tap instead
            of re-typing a resume for the fortieth portal.
          </Callout>
        </div>
      </Section>
    </>
  );
}