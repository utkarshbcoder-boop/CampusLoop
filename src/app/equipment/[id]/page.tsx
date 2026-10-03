import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoltIcon, CheckIcon, PinIcon, ShieldIcon } from "@/components/Icon";
import { RentButton, SaveButton } from "@/components/Actions";
import { EquipmentCard } from "@/components/cards";
import { Callout, KeyValue, Section, StarRating, TagList } from "@/components/ui";
import { rupees, titleCase } from "@/lib/format";
import { getColleges, getEquipment, getEquipmentItem } from "@/lib/queries";
import { getDataProvider } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getEquipmentItem(id);
  if (!item) return { title: "Equipment not found" };
  return { title: item.name, description: `${item.name} for rent at ${rupees(item.day_rate)}/day on your campus.` };
}

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, colleges] = await Promise.all([getEquipmentItem(id), getColleges()]);
  if (!item) notFound();

  const provider = await getDataProvider();
  const owner = (await provider.profiles.byId(item.owner_id)) ?? undefined;
  const college = colleges.find((c) => c.id === item.college_id);

  const related = (
    await getEquipment({ q: "", category: item.category, maxDayRate: null, sort: "rating" })
  )
    .filter((e) => e.id !== item.id)
    .slice(0, 3);

  const savings = Math.round((1 - item.day_rate / Math.max(1, item.day_rate * 12)) * 100);

  return (
    <>
      <Section className="py-8">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
          <Link href="/equipment" className="transition hover:text-white">
            Equipment rental
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-white/70">{item.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div
              className="cl-panel relative flex aspect-[16/10] items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(140deg, hsl(${item.hue} 62% 26%), hsl(${(item.hue + 40) % 360} 58% 14%))`,
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
                {item.emoji}
              </span>
              {item.delivery_available ? (
                <span className="absolute top-4 left-4 rounded-full bg-mint-500/90 px-3 py-1 text-[11px] font-bold text-ink-950">
                  Delivers to your hostel
                </span>
              ) : null}
            </div>

            <div className="cl-panel mt-4 p-5">
              <h2 className="text-sm font-semibold text-white">What it is</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{item.description}</p>
              <h3 className="mt-4 text-xs font-semibold tracking-wider text-white/45 uppercase">Specs</h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {item.specs.map((spec) => (
                  <li key={spec} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" aria-hidden />
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="cl-panel cl-panel-solid p-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="cl-chip cl-chip-brand">{titleCase(item.category)}</span>
                <span className="cl-chip">{item.condition}</span>
                <span className="cl-chip">
                  <PinIcon width={11} height={11} />
                  {college?.short_name}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">{item.name}</h1>
              <p className="mt-1 text-sm text-white/50">
                {item.brand} · {item.availability}
              </p>

              <div className="mt-4">
                <StarRating rating={item.rating} count={item.rating_count} />
                <p className="mt-1 text-xs text-white/45">
                  {item.rentals_count} rentals completed · pickup near {item.pickup_location}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white/5 px-2 py-2.5">
                  <p className="text-lg font-bold text-white">{rupees(item.day_rate)}</p>
                  <p className="text-[10px] text-white/40">per day</p>
                </div>
                <div className="rounded-lg bg-white/5 px-2 py-2.5">
                  <p className="text-lg font-bold text-white">{rupees(item.week_rate)}</p>
                  <p className="text-[10px] text-white/40">per week</p>
                </div>
                <div className="rounded-lg bg-white/5 px-2 py-2.5">
                  <p className="text-lg font-bold text-white">{rupees(item.deposit)}</p>
                  <p className="text-[10px] text-white/40">deposit</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <RentButton itemId={item.id} itemName={item.name} dayRate={item.day_rate} />
                <SaveButton id={item.id} />
              </div>

              <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-white/45">
                <ShieldIcon width={14} height={14} className="mt-0.5 shrink-0 text-mint-400" />
                The {rupees(item.deposit)} deposit stays in escrow until the owner confirms the return. Nothing is handed
                over in cash.
              </p>
            </div>

            {owner ? (
              <div className="cl-panel p-5">
                <h2 className="text-sm font-semibold text-white">Owned by {owner.name}</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{owner.bio}</p>
                <div className="mt-4">
                  <TagList tags={[...owner.skills, ...owner.interests]} max={5} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <KeyValue label="Verification" value={titleCase(owner.verification)} />
                  <KeyValue label="Response time" value={owner.response_time} />
                  <KeyValue label="Rating" value={`${owner.rating.toFixed(1)}★ (${owner.rating_count})`} />
                  <KeyValue label="Transactions" value={String(owner.transactions_count)} />
                </dl>
              </div>
            ) : null}

            <Callout title="The maths that makes this work" tone="brand" icon={<BoltIcon width={18} height={18} />}>
              Buying this item new costs roughly {rupees(item.day_rate * 12 * 3)}. Renting it for a fortnight costs{" "}
              {rupees(item.day_rate * 14)} — a {savings > 0 ? `${savings}%` : "large"} saving, and the owner earns for
              gear that would otherwise sit unused.
            </Callout>
          </div>
        </div>
      </Section>

      <Section className="border-t border-white/8 py-12">
        <h2 className="mb-1 text-xl font-bold text-white">More {titleCase(item.category)} on campus</h2>
        <p className="mb-6 text-sm text-white/50">Highest rated first, from the same campus.</p>
        {related.length === 0 ? (
          <div className="cl-panel flex items-center gap-3 p-5">
            <CheckIcon width={18} height={18} className="text-mint-400" />
            <p className="text-sm text-white/60">
              Nothing else in this category is listed on {college?.short_name} right now — you would be the first.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((e) => (
              <EquipmentCard key={e.id} item={e} colleges={colleges} owner={owner} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}