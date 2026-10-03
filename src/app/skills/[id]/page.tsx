import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AwardIcon, CheckIcon, SparkIcon } from "@/components/Icon";
import { SkillExchangeButton, SaveButton } from "@/components/Actions";
import { SkillCard } from "@/components/cards";
import { Callout, EmptyState, KeyValue, Section, ScoreBreakdown, ScoreRing, TagList } from "@/components/ui";
import { titleCase } from "@/lib/format";
import { skillLabel } from "@/lib/data/taxonomy";
import { slotLabel } from "@/lib/data/taxonomy";
import { scoreSkillProfile } from "@/lib/matching/engine";
import { getColleges, getCurrentProfile, getSkillProfile, getSkillProfiles } from "@/lib/queries";
import { getDataProvider } from "@/lib/db";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const skill = await getSkillProfile(id);
  if (!skill) return { title: "Skill offer not found" };
  return { title: skill.title, description: skill.description.slice(0, 155) };
}

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [skill, colleges, profile] = await Promise.all([getSkillProfile(id), getColleges(), getCurrentProfile()]);
  if (!skill) notFound();

  const provider = await getDataProvider();
  const owner = (await provider.profiles.byId(skill.owner_id)) ?? undefined;
  const college = colleges.find((c) => c.id === skill.college_id);

  // Bidirectional match: what they teach that I want, and what I teach that they want.
  const match = owner ? scoreSkillProfile(profile, skill, owner, colleges) : null;

  const related = (
    await getSkillProfiles({ q: "", kind: skill.kind === "teach" ? "learn" : "teach", category: skill.category, sort: "rating" })
  )
    .filter((s) => s.id !== skill.id)
    .slice(0, 3);

  const totalCost = skill.credit_rate * skill.duration_weeks;
  const mine = profile.skills.map((s) => s.toLowerCase());

  return (
    <>
      <Section className="py-8">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
          <Link href="/skills" className="transition hover:text-white">
            Skills exchange
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-white/70">{skill.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-4">
            <div className="cl-panel cl-panel-solid p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={skill.kind === "teach" ? "cl-chip cl-chip-mint" : "cl-chip cl-chip-brand"}>
                  {skill.kind === "teach" ? "Teaching" : "Learning"}
                </span>
                <span className="cl-chip">{titleCase(skill.category)}</span>
                <span className="cl-chip">{titleCase(skill.mode)}</span>
                <span className="cl-chip">{titleCase(skill.verification)}</span>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{skill.title}</h1>

              <div className="mt-3 flex items-center gap-2">
                <p className="text-xs text-white/45">Level</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-5 rounded-full ${i < skill.level ? "bg-brand-400" : "bg-white/12"}`}
                      aria-hidden
                    />
                  ))}
                </div>
                <p className="text-xs text-white/45">{skill.level}/5</p>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/70">{skill.description}</p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <h2 className="text-xs font-semibold tracking-wider text-white/45 uppercase">They can teach</h2>
                  <div className="mt-2">
                    <TagList tags={skill.offering.map(skillLabel)} max={8} tone="mint" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xs font-semibold tracking-wider text-white/45 uppercase">They want to learn</h2>
                  <div className="mt-2">
                    <TagList tags={skill.seeking.map(skillLabel)} max={8} />
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <h2 className="text-xs font-semibold tracking-wider text-white/45 uppercase">Weekly slots</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skill.slots.map((slot) => (
                    <span key={slot} className="cl-chip">
                      {slotLabel(slot)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="cl-panel p-5">
              <h2 className="text-sm font-semibold text-white">Your side of the trade</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] tracking-wider text-white/40 uppercase">Skills they want that you have</p>
                  <div className="mt-1.5">
                    {skill.seeking.some((s) => mine.includes(s.toLowerCase())) ? (
                      <TagList
                        tags={skill.seeking.filter((s) => mine.includes(s.toLowerCase())).map(skillLabel)}
                        max={6}
                        tone="mint"
                      />
                    ) : (
                      <p className="text-xs text-white/45">None of your listed skills match what they want to learn.</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] tracking-wider text-white/40 uppercase">Skills they teach that you want</p>
                  <div className="mt-1.5">
                    {skill.offering.some((s) => profile.seeking_skills.includes(s)) ? (
                      <TagList
                        tags={skill.offering.filter((s) => profile.seeking_skills.includes(s)).map(skillLabel)}
                        max={6}
                        tone="flare"
                      />
                    ) : (
                      <p className="text-xs text-white/45">
                        You are not currently looking for {skill.offering.map(skillLabel).join(" or ")}.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {match ? (
              <div className="cl-panel p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <SparkIcon width={15} height={15} className="text-brand-300" />
                  Full match breakdown
                </h2>
                <div className="mt-4">
                  <ScoreBreakdown breakdown={match.breakdown} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            {match ? (
              <div className="cl-panel cl-panel-solid p-5">
                <div className="flex items-start gap-4">
                  <ScoreRing score={match.score} size={72} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Your match</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/60">{match.headline}</p>
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-4">
                  <KeyValue label="Credit rate" value={`${skill.credit_rate} / session`} />
                  <KeyValue label="Total cost" value={`${totalCost} credits`} />
                  <KeyValue label="Duration" value={`${skill.duration_weeks} weeks`} />
                  <KeyValue
                    label="Your balance"
                    value={`${profile.credits} credits`}
                  />
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  <SkillExchangeButton
                    skillId={skill.id}
                    title={skill.title}
                    creditRate={skill.credit_rate}
                  />
                  <SaveButton id={skill.id} />
                </div>

                {skill.kind === "teach" && totalCost > profile.credits ? (
                  <p className="mt-3 text-[11px] leading-relaxed text-flare-300">
                    You only have {profile.credits} credits — you need {totalCost} for the full {skill.duration_weeks}{" "}
                    weeks. Teach a session first, or request fewer weeks.
                  </p>
                ) : null}
              </div>
            ) : null}

            {owner ? (
              <div className="cl-panel p-5">
                <h2 className="text-sm font-semibold text-white">{owner.name}</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{owner.bio}</p>
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <KeyValue label="Rating" value={`${skill.rating.toFixed(1)}★ (${skill.sessions_completed})`} />
                  <KeyValue label="College" value={college?.short_name ?? "—"} />
                  <KeyValue label="Response" value={owner.response_time} />
                  <KeyValue label="Credits earned" value={String(owner.credits)} />
                </dl>
              </div>
            ) : null}

            <Callout title="Why credits and not money" tone="brand" icon={<AwardIcon width={18} height={18} />}>
              A student who teaches for a semester should not have to pay for what they learn. Credits decouple teaching
              from tuition: your final-year seniors have the skill you need and no use for money, and you have neither
              the skill nor the cash. The exchange also creates a public teaching record, which is what recruiters in a
              campus ecosystem can actually trust.
            </Callout>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section className="border-t border-white/8 py-12">
          <h2 className="mb-6 text-xl font-bold text-white">
            More {skill.kind === "teach" ? "people learning" : "people teaching"} {titleCase(skill.category)}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((s) => (
              <SkillCard key={s.id} skill={s} owner={owner} colleges={colleges} />
            ))}
          </div>
        </Section>
      ) : (
        <Section className="border-t border-white/8 py-12">
          <EmptyState
            title="Nothing else in this category"
            description="The skills exchange is the youngest module, so coverage is patchy. That is an opportunity: listing here costs nothing and the first provider in a category gets every search."
            action={
              <Link href="/skills" className="cl-btn cl-btn-primary">
                <CheckIcon width={15} height={15} />
                Browse all offers
              </Link>
            }
          />
        </Section>
      )}
    </>
  );
}