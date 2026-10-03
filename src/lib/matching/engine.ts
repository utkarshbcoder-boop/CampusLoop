import {
  clamp,
  daysUntil,
  relativeDay,
  rupees,
  rupeesShort,
  titleCase,
} from "@/lib/format";
import type {
  CampusEvent,
  CampusService,
  College,
  Equipment,
  ID,
  Listing,
  MatchDomain,
  MatchPreferences,
  MatchResult,
  MatchSummary,
  MatchTarget,
  PGListing,
  Profile,
  SkillProfile,
  TeammatePost,
} from "@/lib/types";
import {
  aggregate,
  categorical,
  clamp as clampSignal,
  coverage,
  distanceDecay,
  headlineFor,
  intervalFit,
  jaccard,
  label as fitLabel,
  ordinalFit,
  ramp,
  slotOverlap,
  trust,
  verificationDepth,
  type Signal,
} from "./signals";
import { DOMAIN_WEIGHTS } from "./weights";

/**
 * The CampusLoop matching engine.
 *
 * Fully deterministic and dependency-free: same input, same scores, no API key.
 * Every match returns a 0-100 score plus the exact per-signal breakdown that
 * produced it, which the Match Lab renders as a bar chart.
 */

const CREATED_RECENCY_DAYS = 30;

function collegeName(colleges: College[], id: ID | null | undefined): string {
  if (!id) return "Pan-India";
  return colleges.find((c) => c.id === id)?.short_name ?? "Campus";
}

/* ------------------------------------------------------------------ */
/* Teammate matching: profile -> team posts                            */
/* ------------------------------------------------------------------ */

function slotsForPost(post: TeammatePost): string[] {
  if (post.mode === "on_campus") {
    return ["weekday_evening", "weekday_night", "weekend_afternoon", "weekend_evening"];
  }
  if (post.mode === "hybrid") {
    return ["weekday_evening", "weekend_morning", "weekend_afternoon", "weekend_evening"];
  }
  return ["weekday_night", "weekend_afternoon", "weekend_evening"];
}

function requiredSkills(post: TeammatePost): string[] {
  return [...new Set(post.roles_needed.flatMap((r) => r.skills))];
}

export function scoreTeammatePost(
  profile: Profile,
  post: TeammatePost,
  colleges: College[],
): MatchResult<TeammatePost> {
  const w = DOMAIN_WEIGHTS.teammate;
  const needed = requiredSkills(post);
  const covered = coverage(profile.skills, needed);
  const missing = needed.filter((s) => !profile.skills.map((x) => x.toLowerCase()).includes(s.toLowerCase()));

  const slotScore = slotOverlap(profile.available_slots, slotsForPost(post));

  // Capacity: how many free hours the profile plausibly has, derived from slots.
  const capacityHours = profile.available_slots.length * 3.5;
  const commitmentScore = ramp(Math.abs(capacityHours - post.hours_per_week), 0, 22);

  const interestScore = jaccard(profile.interests, [...post.tags, post.project_type]);

  const sameCollege = profile.college_id === post.college_id ? 1 : 0.45;
  const repScore = trust(profile.rating, profile.rating_count, profile.transactions_count, 0);
  const verScore = verificationDepth(profile.verification);

  const signals: Signal[] = [
    {
      key: "skill_complement",
      label: "Skill complement",
      weight: w.skill_complement,
      raw: covered,
      detail:
        covered >= 0.999
          ? `You cover all ${needed.length} skills they are missing`
          : missing.length === 0
            ? `Covers all ${needed.length} required skills`
            : `Covers ${needed.length - missing.length}/${needed.length}; still missing ${missing.slice(0, 3).join(", ")}`,
    },
    {
      key: "availability",
      label: "Availability overlap",
      weight: w.availability,
      raw: slotScore,
      detail: `${Math.round(slotScore * 100)}% of the build windows line up with your free slots`,
    },
    {
      key: "commitment",
      label: "Commitment fit",
      weight: w.commitment,
      raw: commitmentScore,
      detail: `They want ${post.hours_per_week} h/week; your free slots suggest about ${Math.round(capacityHours)} h`,
    },
    {
      key: "interest_overlap",
      label: "Interest overlap",
      weight: w.interest_overlap,
      raw: interestScore,
      detail:
        interestScore >= 0.3
          ? `You share ${Math.round(interestScore * 100)}% of interest tags with this project`
          : "Your stated interests are a different direction from this project",
    },
    {
      key: "college_proximity",
      label: "Campus proximity",
      weight: w.college_proximity,
      raw: sameCollege,
      detail:
        sameCollege === 1
          ? `Same campus as the post (${collegeName(colleges, post.college_id)}) — five-minute meetups`
          : `Different campus from the post (${collegeName(colleges, post.college_id)})`,
    },
    {
      key: "reputation",
      label: "Reputation",
      weight: w.reputation,
      raw: repScore,
      detail: `${profile.rating.toFixed(1)}★ from ${profile.rating_count} ratings across ${profile.transactions_count} transactions`,
    },
    {
      key: "verification",
      label: "Verification",
      weight: w.verification,
      raw: verScore,
      detail: `Identity verified via ${titleCase(profile.verification)}`,
    },
  ];

  const { score, breakdown } = aggregate(signals);
  return {
    domain: "teammate",
    id: post.id,
    title: post.title,
    subtitle: `${post.event_name} · ${collegeName(colleges, post.college_id)}`,
    score,
    headline: `${fitLabel(score / 100)} — ${headlineFor(breakdown)}`,
    breakdown,
    target: post,
  };
}

/* ------------------------------------------------------------------ */
/* Roommate matching: profile -> PG listings                          */
/* ------------------------------------------------------------------ */

export function scorePGListing(
  profile: Profile,
  pg: PGListing,
  prefs: MatchPreferences,
): MatchResult<PGListing> {
  const w = DOMAIN_WEIGHTS.roommate;

  const budgetScore = intervalFit(pg.rent, prefs.budget_min, prefs.budget_max, 3500);
  const distanceScore = distanceDecay(pg.distance_km, 5);

  const lifestyleParts: number[] = [
    categorical(prefs.sleep_schedule === "any" ? "any" : profile.sleep_schedule, pg.current_roommates.length > 0 ? "flexible" : "any"),
    categorical(prefs.food === "any" ? "any" : profile.food, pg.food === "none" ? "any" : pg.food),
    categorical(prefs.smoking === "any" ? "any" : profile.smoking, "non_smoker"),
    categorical(prefs.gender === "any" ? "any" : prefs.gender, pg.gender === "any" ? "any" : pg.gender),
  ];
  const lifestyleScore = lifestyleParts.reduce((a, b) => a + b, 0) / lifestyleParts.length;

  const comfortParts = [
    pg.attached_washroom ? 1 : 0.45,
    clamp(pg.wifi_mbps / 300, 0, 1),
    pg.has_ac ? 1 : 0.4,
    clamp(pg.amenities.length / 8, 0, 1),
  ];
  const comfortScore = comfortParts.reduce((a, b) => a + b, 0) / comfortParts.length;

  const days = daysUntil(pg.available_from);
  const availabilityScore = days <= 7 ? 1 : ramp(days, 60, 7);

  // Value: what you get per rupee, boosted when bills are included.
  const valueScore = clamp((pg.rent / (pg.beds_available + 1 + pg.amenities.length * 0.6 + (pg.bills_included ? 900 : 0))) / 1000, 0, 1);

  const repScore = clamp(
    0.4 * clamp((pg.saves / 100), 0, 1) + 0.3 * (pg.owner_is_alum ? 1 : 0.5) + 0.3 * clamp(pg.photos_count / 20, 0, 1),
    0,
    1,
  );

  const signals: Signal[] = [
    {
      key: "budget_fit",
      label: "Budget fit",
      weight: w.budget_fit,
      raw: budgetScore,
      detail: `${rupees(pg.rent)}/month against your ${rupeesShort(prefs.budget_min)}–${rupeesShort(prefs.budget_max)} band`,
    },
    {
      key: "distance",
      label: "Commute distance",
      weight: w.distance,
      raw: distanceScore,
      detail: `${pg.distance_km} km from campus, about a ${pg.walk_minutes_to_campus}-minute walk`,
    },
    {
      key: "lifestyle",
      label: "Lifestyle alignment",
      weight: w.lifestyle,
      raw: lifestyleScore,
      detail: `Sleep ${titleCase(profile.sleep_schedule)}, ${titleCase(profile.food)}, ${pg.food === "none" ? "no food provided" : `${titleCase(pg.food)} food`}, ${pg.gender} housing`,
    },
    {
      key: "comfort",
      label: "Comfort & facilities",
      weight: w.comfort,
      raw: comfortScore,
      detail: `${pg.attached_washroom ? "Attached" : "Shared"} washroom, ${pg.wifi_mbps} Mbps Wi-Fi, ${pg.has_ac ? "AC" : "fan cooling"}, ${pg.amenities.length} amenities`,
    },
    {
      key: "availability",
      label: "Move-in availability",
      weight: w.availability,
      raw: availabilityScore,
      detail: `Available ${relativeDay(pg.available_from)} (${pg.beds_available} bed${pg.beds_available === 1 ? "" : "s"})`,
    },
    {
      key: "value",
      label: "Value for money",
      weight: w.value,
      raw: valueScore,
      detail: `${rupees(pg.rent)} for ${pg.room_type}${pg.bills_included ? ", bills included" : ", bills extra"}`,
    },
    {
      key: "reputation",
      label: "Reputation",
      weight: w.reputation,
      raw: repScore,
      detail: `${pg.saves} saves, ${pg.enquiries} enquiries, owner is ${pg.owner_is_alum ? "an alumnus" : "external"}`,
    },
  ];

  const { score, breakdown } = aggregate(signals);
  return {
    domain: "roommate",
    id: pg.id,
    title: pg.title,
    subtitle: `${pg.locality} · ${rupees(pg.rent)}/month`,
    score,
    headline: `${fitLabel(score / 100)} — ${headlineFor(breakdown)}`,
    breakdown,
    target: pg,
  };
}

/* ------------------------------------------------------------------ */
/* Roommate matching: profile -> other students                        */
/* ------------------------------------------------------------------ */

export function scoreRoommateCandidate(
  profile: Profile,
  candidate: Profile,
  prefs: MatchPreferences,
  colleges: College[],
): MatchResult<Profile> {
  const w = DOMAIN_WEIGHTS.roommate;

  // Both budgets must admit the other, so take the weaker of the two fits.
  const cBudget = intervalFit(candidate.budget_max, prefs.budget_min, prefs.budget_max, 3500);
  const pBudget = intervalFit(profile.budget_max, candidate.budget_min, candidate.budget_max, 3500);
  const budgetScore = Math.min(cBudget, pBudget);
  const sharedBand =
    Math.max(profile.budget_min, candidate.budget_min) - Math.min(profile.budget_max, candidate.budget_max);

  const sameCampus = profile.college_id === candidate.college_id;
  const distanceScore = sameCampus ? 1 : 0.55;

  const lifestyleParts = [
    categorical(profile.sleep_schedule, candidate.sleep_schedule),
    categorical(profile.food, candidate.food),
    categorical(profile.smoking, candidate.smoking),
    ordinalFit(prefs.cleanliness, candidate.cleanliness),
  ];
  const lifestyleScore = lifestyleParts.reduce((a, b) => a + b, 0) / lifestyleParts.length;

  const comfortScore = clampSignal(1 - Math.abs(prefs.cleanliness - candidate.cleanliness) / 4, 0, 1);

  const joinedDays = Math.abs(new Date(candidate.joined_at).getTime() - new Date(profile.joined_at).getTime()) / 86_400_000;
  const availabilityScore = ramp(joinedDays, 400, 0);

  const valueScore = clampSignal(1 - Math.abs(sharedBand) / 5000, 0, 1);

  const repScore = trust(candidate.rating, candidate.rating_count, candidate.transactions_count, verificationDepth(candidate.verification));

  const signals: Signal[] = [
    {
      key: "budget_fit",
      label: "Budget fit",
      weight: w.budget_fit,
      raw: budgetScore,
      detail: `They need ${rupeesShort(candidate.budget_min)}–${rupeesShort(candidate.budget_max)}; you need ${rupeesShort(profile.budget_min)}–${rupeesShort(profile.budget_max)}`,
    },
    {
      key: "distance",
      label: "Campus proximity",
      weight: w.distance,
      raw: distanceScore,
      detail: sameCampus
        ? `Both at ${collegeName(colleges, candidate.college_id)} — same hostel block is possible`
        : `${collegeName(colleges, profile.college_id)} and ${collegeName(colleges, candidate.college_id)} — you would need a place between the two`,
    },
    {
      key: "lifestyle",
      label: "Lifestyle alignment",
      weight: w.lifestyle,
      raw: lifestyleScore,
      detail: `Sleep ${titleCase(candidate.sleep_schedule)} vs your ${titleCase(profile.sleep_schedule)}; ${titleCase(candidate.food)} vs your ${titleCase(profile.food)}; cleanliness ${candidate.cleanliness}/5`,
    },
    {
      key: "comfort",
      label: "Cleanliness match",
      weight: w.comfort,
      raw: comfortScore,
      detail: `They rate cleanliness ${candidate.cleanliness}/5, you want ${prefs.cleanliness}/5`,
    },
    {
      key: "availability",
      label: "Looking duration",
      weight: w.availability,
      raw: availabilityScore,
      detail: `On CampusLoop since ${new Date(candidate.joined_at).getFullYear()}, so actively searching now`,
    },
    {
      key: "value",
      label: "Budget overlap",
      weight: w.value,
      raw: valueScore,
      detail:
        sharedBand > 0
          ? `Overlapping band of ${rupeesShort(sharedBand)} per month`
          : `No overlap — you are ${rupeesShort(Math.abs(sharedBand))} apart`,
    },
    {
      key: "reputation",
      label: "Reputation",
      weight: w.reputation,
      raw: repScore,
      detail: `${candidate.rating.toFixed(1)}★ from ${candidate.rating_count} ratings, ${titleCase(candidate.verification)}`,
    },
  ];

  const { score, breakdown } = aggregate(signals);
  return {
    domain: "roommate",
    id: candidate.id,
    title: candidate.name,
    subtitle: `${candidate.branch}, Year ${candidate.year_of_study} · ${collegeName(colleges, candidate.college_id)}`,
    score,
    headline: `${fitLabel(score / 100)} — ${headlineFor(breakdown)}`,
    breakdown,
    target: candidate,
  };
}

/* ------------------------------------------------------------------ */
/* Skills exchange matching                                            */
/* ------------------------------------------------------------------ */

export function scoreSkillProfile(
  profile: Profile,
  sp: SkillProfile,
  owner: Profile,
  colleges: College[],
): MatchResult<SkillProfile> {
  const w = DOMAIN_WEIGHTS.skills;

  // Bidirectional: what they offer that I want, and what I offer that they want.
  const theyTeachMe = coverage(sp.offering, profile.seeking_skills);
  const iTeachThem = coverage(profile.skills, sp.seeking);
  const theyAlsoKnow = coverage(profile.skills, sp.offering);
  const complement =
    0.45 * theyTeachMe + 0.35 * iTeachThem + 0.2 * clampSignal(0.5 + (theyAlsoKnow - 0.5) * 0.5, 0, 1);

  const directionScore =
    sp.kind === "teach" ? (profile.seeking_skills.length > 0 ? 1 : 0.35) : profile.skills.length > 0 ? 1 : 0.4;

  const totalCost = sp.credit_rate * sp.duration_weeks;
  const creditScore =
    sp.kind === "teach"
      ? intervalFit(profile.credits, totalCost, totalCost * 2, totalCost * 1.5)
      : clampSignal(owner.credits / Math.max(sp.credit_rate * sp.duration_weeks, 1), 0, 1);

  const slotScore = slotOverlap(profile.available_slots, sp.slots);

  // Ideal level gap: they teach 2-3 levels above the learner.
  const gap = sp.kind === "teach" ? sp.level - 3 : 3 - sp.level;
  const levelScore = clampSignal(1 - Math.abs(gap) / 4, 0, 1);

  const repScore = trust(sp.rating, sp.sessions_completed, sp.sessions_completed, verificationDepth(sp.verification));

  const signals: Signal[] = [
    {
      key: "skill_complement",
      label: "Skill complement",
      weight: w.skill_complement,
      raw: complement,
      detail: `They offer ${sp.offering.length} skill(s) and want ${sp.seeking.length}; you can teach ${iTeachThem * 100 | 0}% of what they ask for`,
    },
    {
      key: "direction_fit",
      label: "Direction fit",
      weight: w.direction_fit,
      raw: directionScore,
      detail:
        sp.kind === "teach"
          ? `They are teaching; you are looking to learn ${profile.seeking_skills.length} skill(s)`
          : `They are learning; you can teach ${profile.skills.length} skill(s)`,
    },
    {
      key: "credit_balance",
      label: "Credit balance",
      weight: w.credit_balance,
      raw: creditScore,
      detail: `Course costs ${sp.credit_rate} credit(s)/week × ${sp.duration_weeks} weeks = ${totalCost}; you hold ${profile.credits}`,
    },
    {
      key: "availability",
      label: "Availability overlap",
      weight: w.availability,
      raw: slotScore,
      detail: `${Math.round(slotScore * 100)}% of their slots overlap with your free time`,
    },
    {
      key: "level_gap",
      label: "Level gap",
      weight: w.level_gap,
      raw: levelScore,
      detail: `Level ${sp.level}/5 against your level 3 baseline — ${gap <= 0 ? "you would be ahead, fine if you want a refresher" : "a productive gap"}`,
    },
    {
      key: "reputation",
      label: "Reputation",
      weight: w.reputation,
      raw: repScore,
      detail: `${sp.rating.toFixed(1)}★ over ${sp.sessions_completed} completed sessions with ${owner.name}`,
    },
  ];

  const { score, breakdown } = aggregate(signals);
  return {
    domain: "skills",
    id: sp.id,
    title: sp.title,
    subtitle: `${owner.name} · ${titleCase(sp.category)} · level ${sp.level}/5 · ${collegeName(colleges, sp.college_id)}`,
    score,
    headline: `${fitLabel(score / 100)} — ${headlineFor(breakdown)}`,
    breakdown,
    target: sp,
  };
}

/* ------------------------------------------------------------------ */
/* Item recommendations: profile -> book listings                      */
/* ------------------------------------------------------------------ */

export function scoreListing(profile: Profile, listing: Listing): MatchResult<Listing> {
  const w = DOMAIN_WEIGHTS.items;

  const subjectScore = Math.max(
    listing.branch === profile.branch ? 1 : 0.2,
    listing.branch === "All branches" ? 0.85 : 0,
    listing.subject === "Design" && profile.branch === "Design" ? 1 : 0,
  );
  const interestScore = jaccard(profile.interests, listing.tags);
  const priceScore = clampSignal(listing.price / 2200, 0, 1);
  const discount = listing.mrp > 0 ? 1 - listing.price / listing.mrp : 0;
  const valueScore = clampSignal(discount * 0.7 + (listing.condition === "like_new" ? 0.3 : listing.condition === "heavy_notes" ? 0.22 : 0.15), 0, 1);
  const recency = ramp(daysUntil(listing.created_at), -CREATED_RECENCY_DAYS, 0);
  const availabilityScore =
    listing.status === "sold" ? 0 : listing.status === "reserved" ? 0.25 : clampSignal(0.5 + recency * 0.5, 0, 1);
  const sellerScore = trust(
    clampSignal(4 + (listing.boosted ? 0.5 : 0), 0, 5),
    listing.saves,
    listing.views,
    listing.boosted ? 0.7 : 0.4,
  );

  const signals: Signal[] = [
    {
      key: "subject_fit",
      label: "Subject relevance",
      weight: w.subject_fit,
      raw: subjectScore,
      detail: `${listing.subject} · ${listing.branch} against your ${profile.branch}`,
    },
    {
      key: "price_fit",
      label: "Price fit",
      weight: w.price_fit,
      raw: priceScore,
      detail: `${rupees(listing.price)} against an MRP of ${rupees(listing.mrp)} (${Math.round(discount * 100)}% off)`,
    },
    {
      key: "interest_fit",
      label: "Interest fit",
      weight: w.interest_fit,
      raw: interestScore,
      detail:
        interestScore > 0
          ? `Tags ${listing.tags.join(", ")} overlap your interests`
          : `No interest overlap — purely a course requirement`,
    },
    {
      key: "value",
      label: "Condition value",
      weight: w.value,
      raw: valueScore,
      detail: `${titleCase(listing.condition)}, ${listing.edition}, ${listing.semester}`,
    },
    {
      key: "availability",
      label: "Availability",
      weight: w.availability,
      raw: availabilityScore,
      detail: `${titleCase(listing.status)} · listed ${relativeDay(listing.created_at)} · ${listing.views} views, ${listing.saves} saves`,
    },
    {
      key: "seller_trust",
      label: "Seller trust",
      weight: w.seller_trust,
      raw: sellerScore,
      detail: `${listing.saves} saves on this listing, ${listing.views} views${listing.boosted ? " · boosted by Premium" : ""}`,
    },
  ];

  const { score, breakdown } = aggregate(signals);
  return {
    domain: "items",
    id: listing.id,
    title: listing.title,
    subtitle: `${listing.author} · ${listing.edition}`,
    score,
    headline: `${fitLabel(score / 100)} — ${headlineFor(breakdown)}`,
    breakdown,
    target: listing,
  };
}

/* ------------------------------------------------------------------ */
/* Item recommendations: profile -> equipment                          */
/* ------------------------------------------------------------------ */

export function scoreEquipment(profile: Profile, item: Equipment, ownerRating: number): MatchResult<Equipment> {
  const w = DOMAIN_WEIGHTS.items;

  const stackMatch = clampSignal(
    coverage(profile.skills, item.category === "laptops" ? ["react", "python", "datascience"] : ["dsalgo", "oops", "matlab", "embedded_c"]) * 0.4 +
      jaccard(profile.interests, [item.category]) * 0.6,
    0,
    1,
  );
  const priceScore = clampSignal(item.day_rate / 1000, 0, 1);
  const weekCost = item.week_rate;
  const valueScore = clampSignal(1 - (item.deposit / Math.max(weekCost, 1)) / 3, 0, 1);
  const availabilityScore = clampSignal(0.6 + (item.delivery_available ? 0.4 : 0.1), 0, 1);
  const ownerScore = trust(ownerRating, item.rating_count, item.rentals_count, 0.5);

  const signals: Signal[] = [
    {
      key: "subject_fit",
      label: "Relevance to your stack",
      weight: w.subject_fit,
      raw: stackMatch,
      detail: `${titleCase(item.category)} — ${item.specs[0] ?? "general purpose"}`,
    },
    {
      key: "price_fit",
      label: "Price fit",
      weight: w.price_fit,
      raw: priceScore,
      detail: `${rupees(item.day_rate)}/day, ${rupees(item.week_rate)}/week, ${rupees(item.deposit)} refundable deposit`,
    },
    {
      key: "interest_fit",
      label: "Interest fit",
      weight: w.interest_fit,
      raw: jaccard(profile.interests, [item.category]),
      detail: `Category interest overlap for ${titleCase(item.category)}`,
    },
    {
      key: "value",
      label: "Value for money",
      weight: w.value,
      raw: valueScore,
      detail: `Deposit is ${Math.round((item.deposit / Math.max(weekCost, 1)) * 100)}% of a week's rent`,
    },
    {
      key: "availability",
      label: "Availability",
      weight: w.availability,
      raw: availabilityScore,
      detail: `${item.availability} · ${item.delivery_available ? "delivered to hostel" : "pickup only"}`,
    },
    {
      key: "seller_trust",
      label: "Owner trust",
      weight: w.seller_trust,
      raw: ownerScore,
      detail: `${item.rating.toFixed(1)}★ from ${item.rating_count} ratings across ${item.rentals_count} rentals`,
    },
  ];

  const { score, breakdown } = aggregate(signals);
  return {
    domain: "items",
    id: item.id,
    title: item.name,
    subtitle: `${item.brand} · ${titleCase(item.category)}`,
    score,
    headline: `${fitLabel(score / 100)} — ${headlineFor(breakdown)}`,
    breakdown,
    target: item,
  };
}

/* ------------------------------------------------------------------ */
/* Service matching                                                    */
/* ------------------------------------------------------------------ */

/** Derive likely service needs from the profile's own lifestyle signals. */
function serviceNeedVector(profile: Profile, service: CampusService): number {
  const hits: number[] = [];
  switch (service.category) {
    case "laundry":
      // Busier the schedule, the more laundry.
      hits.push(clampSignal(profile.available_slots.length / 5, 0.2, 1));
      break;
    case "catering":
      hits.push(categorical(profile.food, profile.food) * 0.5 + (profile.budget_max < 7000 ? 0.9 : 0.5));
      break;
    case "ac_service":
      hits.push(profile.budget_max >= 7000 ? 0.9 : 0.3);
      break;
    case "pest_control":
      hits.push(profile.cleanliness >= 4 ? 0.85 : 0.4);
      break;
    case "tutoring":
      hits.push(
        clampSignal(profile.credits / 60, 0.2, 1) * 0.4 +
          (profile.seeking_skills.length > 0 ? 0.6 : 0.2) * 0.6,
      );
      break;
    case "bike_repair":
      hits.push(profile.interests.includes("football") || profile.interests.includes("cricket") ? 0.8 : 0.35);
      break;
    case "electrician":
    case "plumber":
    case "moving":
    case "electronics_repair":
      hits.push(profile.year_of_study >= 2 ? 0.75 : 0.4);
      break;
    default:
      hits.push(0.5);
  }
  return hits[0] ?? 0.5;
}

export function scoreService(
  profile: Profile,
  service: CampusService,
  prefs: MatchPreferences,
): MatchResult<CampusService> {
  const w = DOMAIN_WEIGHTS.services;

  const priceScore = intervalFit(service.base_price, prefs.budget_min / 4, prefs.budget_max / 4, 500);
  const needScore = serviceNeedVector(profile, service);
  const repScore = trust(service.rating, service.review_count, service.jobs_completed, service.verified ? 0.9 : 0.2);
  const turnaroundScore = ramp(service.turnaround_hours, 48, 2);
  const coverageScore = service.serviceable_areas.length >= 4 ? 1 : service.serviceable_areas.length / 4;
  const slotScore = slotOverlap(profile.available_slots, service.slots);

  const signals: Signal[] = [
    {
      key: "price_fit",
      label: "Price fit",
      weight: w.price_fit,
      raw: priceScore,
      detail: `${rupees(service.base_price)} per ${service.pricing_unit}`,
    },
    {
      key: "reputation",
      label: "Reputation",
      weight: w.reputation,
      raw: repScore,
      detail: `${service.rating.toFixed(1)}★ from ${service.review_count} reviews, ${service.jobs_completed.toLocaleString("en-IN")} jobs since ${service.provider_since}`,
    },
    {
      key: "need_fit",
      label: "Need fit",
      weight: w.need_fit,
      raw: needScore,
      detail: `${titleCase(service.category)} against your schedule, budget and cleanliness preferences`,
    },
    {
      key: "turnaround",
      label: "Turnaround",
      weight: w.turnaround,
      raw: turnaroundScore,
      detail: `Commits to turning up within ${service.turnaround_hours} hours`,
    },
    {
      key: "coverage",
      label: "Coverage",
      weight: w.coverage,
      raw: coverageScore,
      detail: `Serves ${service.serviceable_areas.slice(0, 3).join(", ")}${service.serviceable_areas.length > 3 ? ` +${service.serviceable_areas.length - 3} more` : ""}`,
    },
    {
      key: "availability",
      label: "Slot availability",
      weight: w.availability,
      raw: slotScore,
      detail: `${service.slots.length} working slots, ${Math.round(slotScore * 100)}% overlap with your free time`,
    },
  ];

  const { score, breakdown } = aggregate(signals);
  return {
    domain: "services",
    id: service.id,
    title: service.name,
    subtitle: `${service.provider_name} · ${titleCase(service.category)}`,
    score,
    headline: `${fitLabel(score / 100)} — ${headlineFor(breakdown)}`,
    breakdown,
    target: service,
  };
}

/* ------------------------------------------------------------------ */
/* Event matching                                                      */
/* ------------------------------------------------------------------ */

export function scoreEvent(profile: Profile, event: CampusEvent): MatchResult<CampusEvent> {
  const w = DOMAIN_WEIGHTS.events;

  const interestScore = Math.max(
    jaccard(profile.interests, event.tags),
    jaccard(profile.interests, [event.category]),
  );
  const senior = profile.year_of_study >= 3;
  const categoryScore =
    event.category === "placement"
      ? senior
        ? 1
        : 0.4
      : event.category === "career"
        ? senior
          ? 0.85
          : 0.6
        : 0.7;

  const daySlot = new Date(event.starts_at).getUTCHours() < 12 ? "morning" : new Date(event.starts_at).getUTCHours() < 17 ? "afternoon" : "evening";
  const slotMatch = profile.available_slots.find((s) => s.includes(daySlot)) !== undefined;
  const scheduleScore = event.is_online ? 0.75 : slotMatch ? 1 : 0.4;

  const fillRatio = event.rsvp_count / Math.max(event.capacity, 1);
  const capacityScore = ramp(fillRatio, 1, 0.15);

  const costScore = event.free ? 1 : clampSignal(1 - event.price / 400, 0.2, 1);
  const momentumScore = ramp(fillRatio, 0.02, 0.7);

  const signals: Signal[] = [
    {
      key: "interest_fit",
      label: "Interest fit",
      weight: w.interest_fit,
      raw: interestScore,
      detail: `${event.tags.slice(0, 4).join(", ")} against your stated interests`,
    },
    {
      key: "category_fit",
      label: "Category & stage fit",
      weight: w.category_fit,
      raw: categoryScore,
      detail: `${titleCase(event.category)} event; you are in year ${profile.year_of_study}`,
    },
    {
      key: "schedule_fit",
      label: "Schedule fit",
      weight: w.schedule_fit,
      raw: scheduleScore,
      detail: event.is_online
        ? "Online — you can join from your hostel without travelling"
        : `Runs in the ${daySlot}; ${slotMatch ? "you are usually free then" : "it clashes with your usual free slots"}`,
    },
    {
      key: "capacity",
      label: "Ease of entry",
      weight: w.capacity,
      raw: capacityScore,
      detail: `${event.rsvp_count.toLocaleString("en-IN")} of ${event.capacity.toLocaleString("en-IN")} spots filled (${Math.round(fillRatio * 100)}%)`,
    },
    {
      key: "cost",
      label: "Cost",
      weight: w.cost,
      raw: costScore,
      detail: event.free ? "Free entry" : `${rupees(event.price)} per head`,
    },
    {
      key: "momentum",
      label: "Momentum",
      weight: w.momentum,
      raw: momentumScore,
      detail: event.featured ? "Featured on the CampusLoop home feed" : "Community-listed event",
    },
  ];

  const { score, breakdown } = aggregate(signals);
  return {
    domain: "events",
    id: event.id,
    title: event.title,
    subtitle: `${event.club} · ${new Date(event.starts_at).toISOString().slice(0, 10)}`,
    score,
    headline: `${fitLabel(score / 100)} — ${headlineFor(breakdown)}`,
    breakdown,
    target: event,
  };
}

/* ------------------------------------------------------------------ */
/* Orchestration                                                      */
/* ------------------------------------------------------------------ */

export interface MatchContext {
  profile: Profile;
  colleges: College[];
  prefs: MatchPreferences;
  listings: Listing[];
  equipment: Equipment[];
  pgListings: PGListing[];
  teammatePosts: TeammatePost[];
  skillProfiles: SkillProfile[];
  profiles: Profile[];
  services: CampusService[];
  events: CampusEvent[];
}

export function runMatch(domain: MatchDomain, ctx: MatchContext): MatchResult<unknown>[] {
  switch (domain) {
    case "teammate":
      return ctx.teammatePosts
        .filter((p) => ctx.prefs.college_id === "all" || p.college_id === ctx.prefs.college_id)
        .map((p) => scoreTeammatePost(ctx.profile, p, ctx.colleges));
    case "roommate":
      return ctx.pgListings
        .filter((p) => ctx.prefs.college_id === "all" || p.college_id === ctx.profile.college_id)
        .map((p) => scorePGListing(ctx.profile, p, ctx.prefs));
    case "skills":
      return ctx.skillProfiles
        .filter((s) => s.owner_id !== ctx.profile.id)
        .map((s) => {
          const owner = ctx.profiles.find((p) => p.id === s.owner_id) ?? ctx.profile;
          return scoreSkillProfile(ctx.profile, s, owner, ctx.colleges);
        });
    case "items":
      return [
        ...ctx.listings
          .filter((l) => l.status !== "sold")
          .map((l) => scoreListing(ctx.profile, l)),
        ...ctx.equipment.map((e) => {
          const owner = ctx.profiles.find((p) => p.id === e.owner_id);
          return scoreEquipment(ctx.profile, e, owner?.rating ?? 4.2);
        }),
      ];
    case "services":
      return ctx.services.map((s) => scoreService(ctx.profile, s, ctx.prefs));
    case "events":
      return ctx.events.map((e) => scoreEvent(ctx.profile, e));
    default:
      return [];
  }
}

export function summarise(
  domain: MatchDomain,
  results: MatchResult<unknown>[],
): MatchSummary {
  const scores = results.map((r) => r.score);
  return {
    domain,
    total_candidates: results.length,
    average_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    top_score: scores.length ? Math.max(...scores) : 0,
    engine: "campusloop-scorer-v1 (deterministic, no API key)",
    computed_at: new Date().toISOString(),
  };
}

/** Build the lightweight adapter the card components render. */
export function toTarget(domain: MatchDomain, id: string): MatchTarget {
  const base: Record<MatchDomain, { href: string; emoji: string }> = {
    teammate: { href: "/teams", emoji: "🧑‍💻" },
    roommate: { href: "/pg", emoji: "🏠" },
    skills: { href: "/skills", emoji: "🎯" },
    items: { href: "/books", emoji: "📚" },
    services: { href: "/services", emoji: "🛠️" },
    events: { href: "/events", emoji: "🎤" },
  };
  const cfg = base[domain];
  return { id, kind: domain, name: "", subtitle: "", href: cfg.href, emoji: cfg.emoji, hue: 220, meta: "" };
}

export const MATCH_ENGINE_VERSION = "1.0.0";

export { clamp };
