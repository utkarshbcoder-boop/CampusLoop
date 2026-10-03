import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookServiceButton, SaveButton } from "@/components/Actions";
import { ServiceCard } from "@/components/cards";
import { Callout, KeyValue, PageHeader, Section, StarRating, TagList } from "@/components/ui";
import { CheckIcon, ClockIcon, PinIcon, ShieldIcon } from "@/components/Icon";
import { rupees, titleCase } from "@/lib/format";
import { getColleges, getServices, getService } from "@/lib/queries";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const service = await getService(id);
  if (!service) return { title: "Service not found" };
  return {
    title: service.name,
    description: `${service.name} by ${service.provider_name} — ${rupees(service.base_price)} per ${service.pricing_unit}, ${service.turnaround_hours}h turnaround.`,
  };
}

const SLOT_LABELS: Record<string, string> = {
  weekday_morning: "Weekday morning · 8am–11am",
  weekday_afternoon: "Weekday afternoon · 12pm–4pm",
  weekday_evening: "Weekday evening · 4pm–8pm",
  weekday_night: "Late night · 9pm–11pm",
  weekend_morning: "Saturday morning · 8am–11am",
  weekend_evening: "Sunday evening · 4pm–8pm",
  emergency: "Emergency · within 2 hours",
};

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [service, colleges] = await Promise.all([getService(id), getColleges()]);
  if (!service) notFound();

  const college = colleges.find((c) => c.id === service.college_id);

  const related = (await getServices({ q: "", category: service.category, maxPrice: null, minRating: null, sort: "rating" }))
    .filter((s) => s.id !== service.id)
    .slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow={titleCase(service.category)}
        title={service.name}
        description={service.description}
      >
        <SaveButton id={service.id} label="Save provider" />
      </PageHeader>

      <Section className="pt-6">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
          <Link href="/services" className="transition hover:text-white">
            Verified services
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-white/70">{service.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-6">
            <div className="cl-panel cl-panel-solid p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                {service.verified ? (
                  <span className="cl-chip cl-chip-mint">
                    <CheckIcon width={12} height={12} /> ID verified
                  </span>
                ) : null}
                {service.premium_only ? <span className="cl-chip cl-chip-flare">⭐ Premium priority</span> : null}
                <span className="cl-chip">{college?.short_name ?? "Campus-wide"}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <p className="text-3xl font-black tracking-tight text-white">{rupees(service.base_price)}</p>
                <p className="text-sm text-white/45">per {service.pricing_unit}</p>
              </div>

              <div className="mt-4">
                <StarRating rating={service.rating} count={service.review_count} />
              </div>

              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <KeyValue label="Provider" value={service.provider_name} />
                <KeyValue label="On CampusLoop since" value={String(service.provider_since)} />
                <KeyValue
                  label="Turnaround"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <ClockIcon width={14} height={14} className="text-white/40" />
                      {service.turnaround_hours} hours
                    </span>
                  }
                />
                <KeyValue label="Jobs completed" value={service.jobs_completed.toLocaleString("en-IN")} />
              </dl>
            </div>

            <div className="cl-panel p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white">Guarantee</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{service.guarantee}</p>
            </div>

            <div className="cl-panel p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white">Where this provider works</h2>
              <div className="mt-3">
                <TagList tags={service.serviceable_areas} max={12} tone="mint" />
              </div>
              <p className="mt-3 text-xs text-white/40">
                Outside these areas the provider is shown as unavailable, so you never wait for a confirmation that will not
                come.
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="cl-panel cl-panel-solid p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white">Book a slot</h2>
              <p className="mt-1.5 text-xs text-white/45">
                Pick a window, describe the issue, pay only once the job is done.
              </p>
              <div className="mt-4">
                <BookServiceButton
                  serviceId={service.id}
                  serviceName={service.name}
                  price={service.base_price}
                  premiumOnly={service.premium_only}
                />
              </div>
              <div className="mt-5 border-t border-white/8 pt-5">
                <p className="text-[11px] font-medium tracking-wide text-white/40 uppercase">Typical slots</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {service.slots.map((slot) => (
                    <li key={slot} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckIcon width={14} height={14} className="shrink-0 text-mint-400" />
                      {SLOT_LABELS[slot] ?? titleCase(slot)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 cl-panel p-5">
              <div className="flex items-start gap-3">
                <ShieldIcon width={18} height={18} className="mt-0.5 shrink-0 text-mint-400" />
                <p className="text-xs leading-relaxed text-white/55">
                  CampusLoop takes a flat 8% from the provider — not from you. Your price is{" "}
                  <strong className="text-white">{rupees(service.base_price)}</strong> exactly as listed.
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
                  More {titleCase(service.category)} near campus
                </h2>
                <p className="mt-1.5 text-sm text-white/50">
                  <PinIcon width={13} height={13} className="mr-1 inline align-[-1px]" />
                  Ranked by rating within your service area.
                </p>
              </div>
              <Link href="/services" className="cl-btn cl-btn-ghost shrink-0">
                All services
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((s) => (
                <ServiceCard key={s.id} service={s} colleges={colleges} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-10">
          <Callout title="Running a service business on campus?" tone="brand">
            Register once, get verified, and reach every student on the network instead of one hostel group chat. CampusLoop
            keeps 8% and handles scheduling, payment collection and the guarantee pool.{" "}
            <Link href="/business" className="text-brand-300">
              See the provider economics
            </Link>
            .
          </Callout>
        </div>
      </Section>
    </>
  );
}