import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BoltIcon, CheckIcon, PinIcon, SparkIcon, UsersIcon } from "@/components/Icon";
import { ContactButton, SaveButton } from "@/components/Actions";
import { PGCard } from "@/components/cards";
import { Callout, KeyValue, Section, TagList } from "@/components/ui";
import { relativeDay, rupees, titleCase } from "@/lib/format";
import { getColleges, getCurrentProfile, getPGListing, getPGListings } from "@/lib/queries";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const room = await getPGListing(id);
  if (!room) return { title: "Room not found" };
  return { title: room.title, description: `${room.title} at ${rupees(room.rent)}/month, ${room.distance_km} km from campus.` };
}

export default async function PGDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [room, colleges, profile] = await Promise.all([getPGListing(id), getColleges(), getCurrentProfile()]);
  if (!room) notFound();

  const college = colleges.find((c) => c.id === room.college_id);
  const mine = profile.college_id === room.college_id;
  const budgetFit = room.rent <= profile.budget_max;
  const genderOk = room.gender === "any" || room.gender === profile.gender;

  const related = (
    await getPGListings({
      q: "",
      type: room.type,
      gender: "all",
      maxRent: Math.round(room.rent * 1.25),
      maxDistance: null,
      sort: "distance",
    })
  )
    .filter((r) => r.id !== room.id)
    .slice(0, 3);

  // Market benchmark across every live listing on the platform.
  const all = await getPGListings({ q: "", type: "all", gender: "all", maxRent: null, maxDistance: null, sort: "rent_asc" });
  const marketAverage = all.length ? Math.round(all.reduce((a, r) => a + r.rent, 0) / all.length) : room.rent;

  return (
    <>
      <Section className="py-8">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
          <Link href="/pg" className="transition hover:text-white">
            PG &amp; roommates
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-white/70">{room.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div
              className="cl-panel relative flex aspect-[16/10] items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(140deg, hsl(${room.hue} 62% 26%), hsl(${(room.hue + 40) % 360} 58% 14%))`,
              }}
            >
              <div
                className="absolute inset-0 opacity-45"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.3), transparent 42%), repeating-linear-gradient(45deg, rgba(0,0,0,0.14) 0 6px, transparent 6px 12px)",
                }}
                aria-hidden
              />
              <span className="relative text-8xl drop-shadow-2xl" aria-hidden>
                {room.emoji}
              </span>
              <span className="absolute top-4 left-4 rounded-full bg-ink-950/80 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                {titleCase(room.type)}
              </span>
              {room.owner_is_alum ? (
                <span className="absolute top-4 right-4 rounded-full bg-mint-500/90 px-3 py-1 text-[11px] font-bold text-ink-950">
                  Listed by an alumnus
                </span>
              ) : null}
            </div>

            <div className="cl-panel mt-4 p-5">
              <h2 className="text-sm font-semibold text-white">About this place</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{room.description}</p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold tracking-wider text-white/45 uppercase">Amenities</h3>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {room.amenities.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-xs text-white/60">
                        <CheckIcon width={13} height={13} className="mt-0.5 shrink-0 text-mint-400" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-wider text-white/45 uppercase">House rules</h3>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {room.house_rules.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-xs text-white/60">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-flare-400" aria-hidden />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {room.current_roommates.length > 0 ? (
                <div className="mt-5">
                  <h3 className="text-xs font-semibold tracking-wider text-white/45 uppercase">Current roommates</h3>
                  <div className="mt-2">
                    <TagList tags={room.current_roommates} max={6} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="cl-panel cl-panel-solid p-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="cl-chip">{room.room_type}</span>
                <span className="cl-chip">{titleCase(room.gender)} only</span>
                {room.has_ac ? <span className="cl-chip cl-chip-mint">AC</span> : null}
                {room.attached_washroom ? <span className="cl-chip cl-chip-mint">Attached bath</span> : null}
                {room.food !== "none" ? <span className="cl-chip cl-chip-mint">{titleCase(room.food)}</span> : null}
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">{room.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-white/50">
                <PinIcon width={13} height={13} />
                {room.locality} · {room.distance_km} km from {college?.short_name} ({room.walk_minutes_to_campus} min
                walk)
              </p>

              <div className="mt-4 flex items-end gap-3">
                <p className="text-4xl font-black tracking-tight text-white">{rupees(room.rent)}</p>
                <p className="pb-1 text-sm text-white/45">per month</p>
              </div>
              <p className="mt-1 text-xs text-white/45">
                {rupees(room.deposit)} deposit · {room.bills_included ? "electricity and maintenance included" : "bills extra"}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-4">
                <KeyValue label="Occupancy" value={`${room.occupancy} per room`} />
                <KeyValue label="Beds free" value={`${room.beds_available}`} />
                <KeyValue label="Wi-Fi" value={`${room.wifi_mbps} Mbps`} />
                <KeyValue label="Available" value={relativeDay(room.available_from)} />
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <ContactButton sellerName={room.owner_name} itemTitle={room.title} premiumUpsell />
                <SaveButton id={room.id} label="Save room" />
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-white/45">
                Owner: {room.owner_name} · {room.owner_contact}. Contact details are shared only after you both confirm a
                viewing.
              </p>
            </div>

            {/* The personal fit check — the same signals the engine uses. */}
            <div className="cl-panel p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <SparkIcon width={15} height={15} className="text-brand-300" />
                How this fits you
              </h2>
              <ul className="mt-3 flex flex-col gap-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className={budgetFit ? "text-mint-400" : "text-rose-400"} aria-hidden>
                    {budgetFit ? <CheckIcon width={14} height={14} /> : <BoltIcon width={14} height={14} />}
                  </span>
                  <span className="text-white/65">
                    {budgetFit
                      ? `Within your ${rupees(profile.budget_max)}/month ceiling`
                      : `${rupees(room.rent - profile.budget_max)} over your ${rupees(profile.budget_max)}/month ceiling`}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={mine ? "text-mint-400" : "text-flare-400"} aria-hidden>
                    {mine ? <CheckIcon width={14} height={14} /> : <BoltIcon width={14} height={14} />}
                  </span>
                  <span className="text-white/65">
                    {mine
                      ? `You are at ${college?.short_name}, so the commute is walkable`
                      : `You are not at ${college?.short_name}, so you would need to commute from here`}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={genderOk ? "text-mint-400" : "text-rose-400"} aria-hidden>
                    {genderOk ? <CheckIcon width={14} height={14} /> : <BoltIcon width={14} height={14} />}
                  </span>
                  <span className="text-white/65">
                    {room.gender === "any" ? "Open to any gender" : `Listed for ${titleCase(room.gender)} accommodation`}
                  </span>
                </li>
              </ul>
              <Link href="/match-lab?domain=roommate" className="cl-btn cl-btn-ghost mt-4 w-full justify-center">
                <UsersIcon width={15} height={15} />
                See ranked roommate candidates
              </Link>
            </div>

            <Callout title="How the rent compares" tone="mint">
              {rupees(room.rent)} a month with {room.bills_included ? "bills included" : "bills extra"} in{" "}
              {room.locality}. The average listing within {room.distance_km} km of {college?.short_name} on CampusLoop is{" "}
              {rupees(marketAverage)}, so this one is{" "}
              {room.rent <= marketAverage ? "at or below" : "above"} the going rate.
            </Callout>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section className="border-t border-white/8 py-12">
          <h2 className="mb-1 text-xl font-bold text-white">Similar rooms nearby</h2>
          <p className="mb-6 text-sm text-white/50">Same type, within 25% of this rent.</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((r) => (
              <PGCard key={r.id} pg={r} colleges={colleges} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}