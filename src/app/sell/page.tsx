import type { Metadata } from "next";
import { SellForm } from "@/components/SellForm";
import { PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sell on CampusLoop",
  description: "List your used books and second-hand devices for students on your campus in under a minute.",
};

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialKind = params.type === "device" ? "device" : params.type === "home" ? "home" : "book";

  return (
    <>
      <PageHeader
        eyebrow="Sell on CampusLoop"
        title="List it once. A senior down the hall buys it."
        description="Sell used textbooks or a second-hand device in under a minute. Verified students, escrow-backed handover, zero listing fee."
      />
      <Section className="pt-6">
        <div className="mx-auto w-full max-w-xl">
          <SellForm initialKind={initialKind} />
        </div>
      </Section>
    </>
  );
}
