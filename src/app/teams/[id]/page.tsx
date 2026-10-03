import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AwardIcon, CheckIcon, SparkIcon, UsersIcon } from "@/components/Icon";
import { ApplyButton, SaveButton } from "@/components/Actions";
import { TeammateCard } from "@/components/cards";
import { Callout, EmptyState, KeyValue, Section, ScoreBreakdown, ScoreRing, TagList } from "@/components/ui";
import { rupeesShort, timeAgo, titleCase } from "@/lib/format";
import { skillLabel } from "@/lib/data/taxonomy";
import { scoreTeammatePost } from "@/lib/matching/engine";
import { getColleges, getCurrentProfile, getTeammatePost, getTeammatePosts } from "@/lib/queries";
import { getDataProvider } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getTeammatePost(id);
  if (!post) return { title: "Team post not found" };
  return { title: post.title, description: `${post.event_name} — recruiting ${post.roles_needed.length} roles.` };
}

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, colleges, profile] = await Promise.all([getTeammatePost(id), getColleges(), getCurrentProfile()]);
  if (!post) notFound();

  const provider = await getDataProvider();
  const owner = (await provider.profiles.byId(post.owner_id)) ?? undefined;
  const college = colleges.find((c) => c.id === post.college_id);

  // The page shows the signed-in student's real match score for this post.
  const match = scoreTeammatePost(profile, post, colleges);

  const other = (
    await getTeammatePosts({ q: "", type: post.project_type, tier: "all", mode: "all", sort: "recent" })
  )
    .filter((p) => p.id !== post.id)
    .slice(0, 3);

  const needed = post.roles_needed.flatMap((r) => r.skills);
  const mine = profile.skills.map((s) => s.toLowerCase());
  const covered = needed.filter((s) => mine.includes(s.toLowerCase()));
  const missing = needed.filter((s) => !mine.includes(s.toLowerCase()));

  return (
    <>
      <Section className="py-8">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
          <Link href="/teams" className="transition hover:text-white">
            Project teammates
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-white/70">{post.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-4">
            <div className="cl-panel cl-panel-solid p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="cl-chip cl-chip-brand">{titleCase(post.project_type)}</span>
                <span className="cl-chip">{titleCase(post.hackathon_tier)} tier</span>
                <span className="cl-chip">{titleCase(post.mode)}</span>
                {post.has_certificate ? <span className="cl-chip cl-chip-mint">Certificate</span> : null}
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{post.title}</h1>
              <p className="mt-1 text-sm text-white/50">
                {post.event_name} · {college?.short_name} · posted {timeAgo(post.created_at)}
              </p>

              <p className="mt-4 text-sm leading-relaxed text-white/70">{post.description}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { v: `${post.team_size_target}`, l: "team size target" },
                  { v: `${post.hours_per_week}h`, l: "per week" },
                  { v: `${post.timeline_weeks}w`, l: "timeline" },
                  { v: post.prize_pool ? rupeesShort(post.prize_pool) : "—", l: "prize pool" },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg bg-white/5 px-3 py-2.5">
                    <p className="text-lg font-bold text-white">{s.v}</p>
                    <p className="text-[10px] text-white/40">{s.l}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <h2 className="text-xs font-semibold tracking-wider text-white/45 uppercase">Tech stack</h2>
                <div className="mt-2">
                  <TagList tags={post.tech_stack} max={10} />
                </div>
              </div>
              <div className="mt-4">
                <h2 className="text-xs font-semibold tracking-wider text-white/45 uppercase">Tags</h2>
                <div className="mt-2">
                  <TagList tags={post.tags} max={10} tone="flare" />
                </div>
              </div>
            </div>

            <div className="cl-panel p-5">
              <h2 className="text-sm font-semibold text-white">Roles still open</h2>
              <div className="mt-3 flex flex-col gap-3">
                {post.roles_needed.map((role) => (
                  <div key={role.role} className="rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{titleCase(role.role)}</p>
                      <span className="cl-chip cl-chip-brand">{role.count} needed</span>
                    </div>
                    <div className="mt-2.5">
                      <TagList tags={role.skills.map(skillLabel)} max={8} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Match score + apply */}
          <div className="flex flex-col gap-4">
            <div className="cl-panel cl-panel-solid p-5">
              <div className="flex items-start gap-4">
                <ScoreRing score={match.score} size={72} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Your match for this team</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{match.headline}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <ApplyButton postId={post.id} postTitle={post.title} role={post.roles_needed[0]?.role ?? "teammate"} />
                <SaveButton id={post.id} label="Save" />
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-white/45">
                Applying sends the team your skill list and this match breakdown, so nobody wastes a call on a mismatch.
              </p>
            </div>

            <div className="cl-panel p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <SparkIcon width={15} height={15} className="text-brand-300" />
                What you already cover
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <p className="text-[11px] tracking-wider text-white/40 uppercase">You match</p>
                  <div className="mt-1.5">
                    {covered.length > 0 ? (
                      <TagList tags={covered.map(skillLabel)} max={8} tone="mint" />
                    ) : (
                      <p className="text-xs text-white/45">Nothing in their skill list yet.</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] tracking-wider text-white/40 uppercase">They still need</p>
                  <div className="mt-1.5">
                    {missing.length > 0 ? (
                      <TagList tags={missing.map(skillLabel)} max={8} tone="flare" />
                    ) : (
                      <p className="text-xs text-white/45">You cover every skill on this post.</p>
                    )}
                  </div>
                </div>
              </div>
              <Link href="/match-lab?domain=teammate" className="cl-btn cl-btn-ghost mt-4 w-full justify-center">
                Tune your skill profile
              </Link>
            </div>

            <div className="cl-panel p-5">
              <h2 className="text-sm font-semibold text-white">Full score breakdown</h2>
              <div className="mt-4">
                <ScoreBreakdown breakdown={match.breakdown} />
              </div>
            </div>

            {owner ? (
              <div className="cl-panel p-5">
                <h2 className="text-sm font-semibold text-white">Posted by {owner.name}</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{owner.bio}</p>
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <KeyValue label="Branch" value={owner.branch.split(",")[0]} />
                  <KeyValue label="Year" value={`Year ${owner.year_of_study}`} />
                  <KeyValue label="Rating" value={`${owner.rating.toFixed(1)}★`} />
                  <KeyValue label="Response" value={owner.response_time} />
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      {other.length > 0 ? (
        <Section className="border-t border-white/8 py-12">
          <h2 className="mb-6 text-xl font-bold text-white">Other {titleCase(post.project_type)} teams recruiting</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {other.map((p) => (
              <TeammateCard key={p.id} post={p} colleges={colleges} owner={owner} />
            ))}
          </div>
        </Section>
      ) : (
        <Section className="border-t border-white/8 py-12">
          <EmptyState
            title="No other teams in this category"
            description="This post is one of a kind on the platform right now. Check back after the next registration push, or start your own team."
            action={
              <Link href="/teams" className="cl-btn cl-btn-primary">
                <UsersIcon width={15} height={15} />
                Browse all teams
              </Link>
            }
          />
        </Section>
      )}

      <Section className="border-t border-white/8 py-10">
        <Callout title="Certificate value" tone="brand" icon={<AwardIcon width={18} height={18} />}>
          {post.has_certificate
            ? "This post offers a verifiable participation certificate, which is the single most requested thing in the comments on team posts — placement season makes them count."
            : "No certificate is offered for this project. Worth knowing before you commit two months to it."}
        </Callout>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/45">
          <CheckIcon width={14} height={14} className="text-mint-400" />
          {post.applicants} students have applied · {post.views} views · {post.filled_count} of {post.team_size_target}{" "}
          places filled
        </div>
      </Section>
    </>
  );
}