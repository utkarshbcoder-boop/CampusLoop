import type { MatchDomain } from "@/lib/types";

/**
 * Signal weights per matching domain.
 *
 * Weights are hand-tuned, sum to 1.0, and are intentionally visible in the UI —
 * the Match Lab prints this exact table so a judge can see the model, not a
 * black box. They are also the single knob to tune if the ranking feels wrong.
 */
export type Weights = Record<string, number>;

export const DOMAIN_WEIGHTS: Record<MatchDomain, Weights> = {
  teammate: {
    skill_complement: 0.3,
    availability: 0.16,
    commitment: 0.14,
    interest_overlap: 0.13,
    college_proximity: 0.1,
    reputation: 0.1,
    verification: 0.07,
  },
  roommate: {
    budget_fit: 0.26,
    distance: 0.16,
    lifestyle: 0.16,
    comfort: 0.12,
    availability: 0.1,
    value: 0.1,
    reputation: 0.1,
  },
  skills: {
    skill_complement: 0.32,
    direction_fit: 0.18,
    credit_balance: 0.13,
    availability: 0.14,
    level_gap: 0.12,
    reputation: 0.11,
  },
  items: {
    subject_fit: 0.24,
    price_fit: 0.22,
    interest_fit: 0.14,
    value: 0.14,
    availability: 0.12,
    seller_trust: 0.14,
  },
  services: {
    price_fit: 0.24,
    reputation: 0.22,
    need_fit: 0.2,
    turnaround: 0.14,
    coverage: 0.12,
    availability: 0.08,
  },
  events: {
    interest_fit: 0.32,
    category_fit: 0.16,
    schedule_fit: 0.16,
    capacity: 0.14,
    cost: 0.12,
    momentum: 0.1,
  },
};

export const DOMAIN_META: Record<
  MatchDomain,
  { title: string; emoji: string; blurb: string; signals: { key: string; label: string; description: string }[] }
> = {
  teammate: {
    title: "Project teammate finder",
    emoji: "🧑‍💻",
    blurb:
      "Ranks team posts by how well your actual skill set fills the roles they are missing, then adjusts for when you are free, how much time you can commit, and whether you have shipped anything before.",
    signals: [
      { key: "skill_complement", label: "Skill complement", description: "Share of the roles they need that your verified skills already cover" },
      { key: "availability", label: "Availability overlap", description: "Jaccard overlap of your free slots against the build windows they publish" },
      { key: "commitment", label: "Commitment fit", description: "Whether the hours per week they want matches the time you actually have" },
      { key: "interest_overlap", label: "Interest overlap", description: "Whether you care about the same problems — a strong predictor of staying committed" },
      { key: "college_proximity", label: "Campus proximity", description: "Same college means you can meet in person in five minutes" },
      { key: "reputation", label: "Reputation", description: "Rating, review volume and transaction history" },
      { key: "verification", label: "Verification", description: "College-email and student-ID verification depth" },
    ],
  },
  roommate: {
    title: "PG & roommate finder",
    emoji: "🏠",
    blurb:
      "Scores a room or a person on the two things that actually break a living arrangement: money and lifestyle. Budget band, commute to campus, sleep schedule, food and cleanliness are weighted hardest.",
    signals: [
      { key: "budget_fit", label: "Budget fit", description: "How close the rent sits to your stated monthly band" },
      { key: "distance", label: "Commute distance", description: "Exponential decay on kilometres from your campus" },
      { key: "lifestyle", label: "Lifestyle alignment", description: "Sleep schedule, food habit, smoking and gender preference" },
      { key: "comfort", label: "Comfort & facilities", description: "Attached washroom, Wi-Fi speed, AC, housekeeping" },
      { key: "availability", label: "Move-in availability", description: "How soon the room or the person is free" },
      { key: "value", label: "Value for money", description: "What you get per rupee, including whether bills are included" },
      { key: "reputation", label: "Reputation", description: "Owner track record, alumni status, enquiry volume" },
    ],
  },
  skills: {
    title: "Skills exchange",
    emoji: "🎯",
    blurb:
      "Time-banking matcher. Checks what you can teach against what they want to learn, in both directions, then verifies you actually hold enough credits to pay for the course they are offering.",
    signals: [
      { key: "skill_complement", label: "Skill complement", description: "Bidirectional: what they offer that you want, and what you offer that they want" },
      { key: "direction_fit", label: "Direction fit", description: "A learner matched to a teacher, not a teacher matched to a learner" },
      { key: "credit_balance", label: "Credit balance", description: "Whether you hold enough time-banking credits to cover the full course" },
      { key: "availability", label: "Availability overlap", description: "Matching weekly slots between you and them" },
      { key: "level_gap", label: "Level gap", description: "A small gap is ideal — too flat and you learn nothing, too wide and it is useless" },
      { key: "reputation", label: "Reputation", description: "Sessions completed, rating and verification" },
    ],
  },
  items: {
    title: "Books & equipment",
    emoji: "📚",
    blurb:
      "Recommends listings by whether the subject is one you actually study, whether the price fits your semester budget, and whether the seller is someone who follows through.",
    signals: [
      { key: "subject_fit", label: "Subject relevance", description: "Branch and semester match against the listing's subject" },
      { key: "price_fit", label: "Price fit", description: "Affordability against your typical spend band" },
      { key: "interest_fit", label: "Interest fit", description: "Tag overlap with your stated interests" },
      { key: "value", label: "Condition value", description: "Discount against MRP, adjusted for how the notes are marked up" },
      { key: "availability", label: "Availability", description: "Still unsold, and posted recently enough to still be findable" },
      { key: "seller_trust", label: "Seller trust", description: "Rating, response time and completed transactions" },
    ],
  },
  services: {
    title: "Verified campus services",
    emoji: "🛠️",
    blurb:
      "Picks the provider most likely to actually turn up on time at a price you will not regret, weighted toward verified track records rather than the cheapest quote.",
    signals: [
      { key: "price_fit", label: "Price fit", description: "Base price against the budget you usually operate at" },
      { key: "reputation", label: "Reputation", description: "Rating, review count, jobs completed and years since" },
      { key: "need_fit", label: "Need fit", description: "Whether the service category matches your lifestyle signals" },
      { key: "turnaround", label: "Turnaround", description: "How quickly they commit to turning up" },
      { key: "coverage", label: "Coverage", description: "Whether they serve your hostel or block" },
      { key: "availability", label: "Slot availability", description: "Do their working slots overlap your free time" },
    ],
  },
  events: {
    title: "College events",
    emoji: "🎤",
    blurb:
      "Ranks events by interest fit and by whether they are worth your evening — free beats paid, easy-to-enter beats sold-out, and a placement track beats another cultural night.",
    signals: [
      { key: "interest_fit", label: "Interest fit", description: "Tag overlap with your stated interests" },
      { key: "category_fit", label: "Category & stage fit", description: "Placement events score higher for seniors, cultural ones for everyone" },
      { key: "schedule_fit", label: "Schedule fit", description: "Does the day and time collide with your other commitments" },
      { key: "capacity", label: "Ease of entry", description: "Plenty of spots left beats a sold-out hall" },
      { key: "cost", label: "Cost", description: "Free events get a boost; paid events are discounted" },
      { key: "momentum", label: "Momentum", description: "A healthy RSVP count suggests a genuinely active event" },
    ],
  },
};

export const ALL_DOMAINS: MatchDomain[] = [
  "teammate",
  "roommate",
  "skills",
  "items",
  "services",
  "events",
];
