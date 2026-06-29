export type PlanId = "free" | "pro" | "unlimited";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  priceNote: string;
  aiPerMonth: number;
  maxQuestionsPerSet: number;
  features: string[];
  highlight?: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: "$0",
    priceNote: "forever",
    aiPerMonth: 5,
    maxQuestionsPerSet: 10,
    features: [
      "5 AI generations / month",
      "Up to 10 questions per set",
      "Unlimited manual sets",
      "25 MB uploads",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "$8",
    priceNote: "per month",
    aiPerMonth: 100,
    maxQuestionsPerSet: 30,
    features: [
      "100 AI generations / month",
      "Up to 30 questions per set",
      "Priority generation",
      "Email support",
    ],
    highlight: true,
  },
  unlimited: {
    id: "unlimited",
    name: "Unlimited",
    price: "$19",
    priceNote: "per month",
    aiPerMonth: 1000,
    maxQuestionsPerSet: 50,
    features: [
      "1,000 AI generations / month",
      "Up to 50 questions per set",
      "Longest exams (timed)",
      "Early access to new features",
    ],
  },
};

export function planFor(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "free"] ?? PLANS.free;
}
