import type { Metadata } from "next";
import { SellForm } from "@/components/SellForm";
import { PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sell on CampusLoop",
  description: "List a second-hand book, device, home, or room for students on your campus.",
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
        title="List it once. Find a student nearby."
        description="Sell a used book or device, or list a home or room for rent or sale. Buyers can register interest and you can track it."
      />
      <Section className="pt-6">
        <div className="mx-auto w-full max-w-xl">
          <SellForm initialKind={initialKind} />
        </div>
      </Section>
    </>
  );
}
