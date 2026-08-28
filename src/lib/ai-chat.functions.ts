import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  DISTRICT_MONTHLY_REFERRALS,
  REFERRAL_STOCKOUTS,
  SUMAN_GAPS,
  TOP_STOCKOUT_DRUGS,
} from "./ai-demo-data";

const Input = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1),
});

type ChatMessage = z.infer<typeof Input>["messages"][number];

type ChartSpec = {
  chartType: "bar" | "horizontalBar" | "line";
  title: string;
  data: Array<Record<string, string | number>>;
  keys: string[];
  colors: string[];
};

const chartBlock = (chart: ChartSpec) =>
  `\n\n\`\`\`json\n${JSON.stringify(chart, null, 2)}\n\`\`\``;

const formatPercent = (value: number) => `${value}%`;

function normalizeQuery(messages: ChatMessage[]): { latest: string; searchable: string } {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim());
  const latest = userMessages.at(-1) ?? "";
  const latestNormalized = latest.toLowerCase();
  const hasDirectTopic = hasAny(latestNormalized, [
    "suman",
    "branding",
    "infrastructure",
    "referral",
    "district hospital",
    "stockout",
    "stock out",
    "drug",
    "medicine",
    "pharmacy",
    "trend",
    "monthly",
    "over time",
  ]);
  const isFollowUp =
    !hasDirectTopic &&
    /^(and|also|what about|show more|more details|drill down|why|which ones|tell me more)\b/i.test(
      latest,
    );
  const previous = userMessages.at(-2) ?? "";
  return {
    latest,
    searchable: (isFollowUp ? `${previous} ${latest}` : latest).toLowerCase(),
  };
}

function hasAny(query: string, words: string[]) {
  return words.some((word) => query.includes(word));
}

function sum<T>(rows: T[], pick: (row: T) => number) {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function sumanResponse(): string {
  const averageInfrastructure = Math.round(
    sum(SUMAN_GAPS, (row) => row.infrastructureScore) / SUMAN_GAPS.length,
  );
  const facilityCount = sum(SUMAN_GAPS, (row) => row.facilities);
  const top = SUMAN_GAPS[0];
  const chart: ChartSpec = {
    chartType: "horizontalBar",
    title: "SUMAN-complete facilities below 60% infrastructure compliance",
    data: SUMAN_GAPS.map((row) => ({
      name: `${row.name} · ${row.district}`,
      infrastructure: row.infrastructureScore,
      branding: row.brandingScore,
    })),
    keys: ["infrastructure", "branding"],
    colors: ["#E76F51", "#0B7B8A"],
  };

  return `I found **${SUMAN_GAPS.length} facilities** where SUMAN branding is complete but infrastructure compliance is below 60%. Together, they cover **${facilityCount} associated labour-room facilities**, with an average infrastructure score of **${averageInfrastructure}%**. This is a visible implementation gap: branding readiness is high, but the physical readiness signal is not keeping pace.

The most urgent location is **${top.name} in ${top.district}**, at **${top.infrastructureScore}%** infrastructure compliance despite **${top.brandingScore}%** branding completion. Alirajpur, Bhind, Sidhi, Ratlam, and Mandla also need targeted infrastructure follow-up in the May 2026 snapshot.${chartBlock(chart)}`;
}

function referralResponse(query: string): string {
  const totalReferrals = sum(REFERRAL_STOCKOUTS, (row) => row.referralIn);
  const totalStockoutFacilities = sum(REFERRAL_STOCKOUTS, (row) => row.stockoutFacilities);
  const top = REFERRAL_STOCKOUTS[0];
  const wantsTrend = hasAny(query, ["trend", "month", "over time", "monthly"]);
  const chart: ChartSpec = wantsTrend
    ? {
        chartType: "line",
        title: "Monthly referral-in volume across Madhya Pradesh",
        data: DISTRICT_MONTHLY_REFERRALS,
        keys: ["referrals"],
        colors: ["#0B7B8A"],
      }
    : {
        chartType: "horizontalBar",
        title: "Referral-in load and facilities reporting drug stockouts",
        data: REFERRAL_STOCKOUTS.map((row) => ({
          name: row.name,
          referralIn: row.referralIn,
          stockoutFacilities: row.stockoutFacilities,
        })),
        keys: ["referralIn", "stockoutFacilities"],
        colors: ["#12355B", "#E76F51"],
      };

  return `The highest combined pressure is concentrated in **${top.name}**, which received **${top.referralIn} referral-ins** and has **${top.stockoutFacilities} facilities** reporting at least one drug stockout (**${formatPercent(top.stockoutRate)}** of the facilities reviewed). Across the six highest-pressure district hospitals, the snapshot records **${totalReferrals.toLocaleString()} referral-ins** alongside **${totalStockoutFacilities} affected facilities**.

Sheopur, Alirajpur, Dindori, Singrauli, Jhabua, and Chhindwara should be prioritised for a joint referral-capacity and medicine-availability review. The relationship is directional rather than causal, but the overlap is operationally important: referral hubs with stockout signals need escalation plans and replenishment visibility.${chartBlock(chart)}`;
}

function stockoutResponse(): string {
  const top = TOP_STOCKOUT_DRUGS[0];
  const totalAffectedFacilities = sum(TOP_STOCKOUT_DRUGS, (row) => row.affectedFacilities);
  const chart: ChartSpec = {
    chartType: "horizontalBar",
    title: "Top 10 drugs by stockout reports this quarter",
    data: TOP_STOCKOUT_DRUGS.map((row) => ({
      name: row.name,
      stockoutReports: row.stockoutReports,
      affectedFacilities: row.affectedFacilities,
    })),
    keys: ["stockoutReports", "affectedFacilities"],
    colors: ["#E76F51", "#0B7B8A"],
  };

  return `The most frequent stockout in the May 2026 snapshot is **${top.name}**, with **${top.stockoutReports} stockout reports** across **${top.affectedFacilities} facilities**. The top 10 medicines span emergency medicines, uterotonics, antibiotics, IV fluids, and antihypertensives, so the risk is not limited to one supply category.

Across these medicines there are **${totalAffectedFacilities} facility-level stockout signals** before de-duplication. Magnesium sulphate, oxytocin, calcium gluconate, and tranexamic acid are the first replenishment priorities because they sit directly in the emergency obstetric response pathway. Use the CSV download below as the handoff list for the next supply review.${chartBlock(chart)}`;
}

function overviewResponse(): string {
  const chart: ChartSpec = {
    chartType: "bar",
    title: "LRMIS coverage snapshot",
    data: [
      { name: "Districts", value: 52 },
      { name: "Facilities", value: 1200 },
      { name: "SUMAN gaps", value: SUMAN_GAPS.length },
      { name: "Drug signals", value: TOP_STOCKOUT_DRUGS.length },
    ],
    keys: ["value"],
    colors: ["#0B7B8A"],
  };
  return `I can search the curated **May 2026 LRMIS snapshot** across **52 districts** and approximately **1,200 facilities**. The current query library covers SUMAN and infrastructure gaps, referral pressure with drug availability, top stockout medicines, and monthly referral trends.

Try asking for SUMAN-complete facilities below 60% infrastructure compliance, district hospitals with high referral-in and drug stockouts, or the top stockout drugs this quarter. Results include a chart and downloadable data for your presentation.${chartBlock(chart)}`;
}

export function answerDemoQuery(messages: ChatMessage[]): string {
  const { latest, searchable } = normalizeQuery(messages);
  const query = `${searchable} ${latest.toLowerCase()}`;

  if (hasAny(query, ["suman", "branding", "infrastructure"])) {
    return sumanResponse();
  }
  if (
    hasAny(query, [
      "referral",
      "referral-in",
      "referral in",
      "district hospital",
      "trend",
      "monthly",
      "over time",
    ])
  ) {
    return referralResponse(query);
  }
  if (hasAny(query, ["stockout", "stock out", "drug", "medicine", "pharmacy"])) {
    return stockoutResponse();
  }
  return overviewResponse();
}

export const askAI = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    return { content: answerDemoQuery(data.messages) };
  });
