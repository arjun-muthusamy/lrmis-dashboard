## LRMIS Dashboard — Major Restructure

This is a large set of structural changes across Overview, Facility/HR, Drugs, Referrals, and Outcomes pages. Plan below; I will implement on approval.

---

### 1. Overview & Rankings page

**Map enhancements (`mp-outline-map.tsx` + `_app.overview.tsx`)**

- Add a **view-mode selector** above the map with options:
  1. **Overall Score** (default — current gradient)
  2. **Rankings** — color by rank tier (top 10 / mid / bottom 10)
  3. **Intersections** (7 preset conditions, see below)
  4. **Supervision Required** — flag districts with composite < 50
  5. **Maternal Deaths (last month)** — highlight districts with reported maternal mortality
  6. **Neonatal Deaths (last month)** — highlight districts with reported neonatal mortality

- **Intersection presets** (highlight matching districts; on click show facilities in that district as location pins, clicking a pin opens the right-side **Facility Scoring Snapshot** panel):
  1. Low referral + poor outcomes
  2. High referral-out + drug stockouts
  3. High referral-out + malfunctioning equipment
  4. High referral-out + HR unavailability
  5. High referral-in + good outcomes (positive)
  6. Poor signal-function + low C-section rate
  7. Low referral + ambulance unavailability + poor outcomes

- **Mortality views**: dotted pins on facilities within flagged districts; hover shows facility name, click opens facility scoring panel.

**Right-side panel hierarchy (`district-detail-panel.tsx` refactor)**

- Click district → panel shows:
  - **Overall composite score** (out of 100)
  - **Average scores by facility level**: L1, L2, L3 (averaged across that district's facilities at each level)
  - Three buttons / accordions: **L1 Facilities**, **L2 Facilities**, **L3 Facilities**
- Click level → expand facility list (name + composite score)
- Click facility → **Facility Scoring Snapshot** subview:
  - Domain breakdown with **weighted max scores** (per attached scoring rubric):
    - HR (weight w_hr)
    - Infrastructure (w_infra)
    - Drugs, Consumables & Equipment (w_drugs)
    - Service Outputs (w_svc)
    - Outcomes (w_out)
    - Referrals (w_ref)
  - Only **overall is out of 100**; domains shown as `score / max_weight`

**Note on scoring weights:** I need the actual weight numbers per L1/L2/L3 from the attached rubric images. I will scaffold with placeholder weights (e.g. HR 20, Infra 20, Drugs 20, Service 15, Outcomes 15, Referrals 10) in `src/lib/scoring-rubric.ts` — **please share or confirm the exact L1/L2/L3 weight matrix** so I can wire real numbers.

**Rankings chart**

- Replace score-based bar/column with a **ranking bar** (1 → N).
- Toggle on each district row reveals: name, total delivery points, count of L1, L2, L3 facilities, overall score.

**Data quality charts**

- Add a level-filter dropdown (All / L1 / L2 / L3) on:
  - Reporting Completeness trend
  - Facility Reporting Gap trend

---

### 2. Tab restructure across pages

Rename / split routes for cleaner mental model:

| Old | New |
|-----|-----|
| `/facility-hr` (mixed) | `/facility-infra` (Facility Profile + Infrastructure Compliance) |
| | `/hr` (HR indicators & charts) |
| `/drugs-referrals` (mixed) | `/drugs` (Drugs, Consumables & Equipment) |
| | `/referrals` (Referrals only) |
| `/obs-hdu` | `/outcomes` (renamed + expanded with new charts) |

Sidebar (`app-sidebar.tsx`) updated accordingly.

**Facility & Infrastructure tab**
- Keep facility profile cards (LaQshya, BEmONC, CEmONC, FRUs, etc.)
- Keep infrastructure compliance drill-down (ANC → MOT → LR → PNC → ObsHDU)
- **Remove**: "Specialist Facilities Not Performing C-Sections" card

**HR tab**
- All HR cards + vacancy / cadre charts
- **Remove**: staff availability trend chart

**Drugs tab**
- Stockout trend + infra compliance for drugs
- **Enhanced stockout filter**: Kind (Medicines / Consumables / Equipment) → **specific item** dropdown → **Facility filter** (default All)
- Clicking a data point or count → opens line-list panel with: facility, district, division, stockout-since (days)

**Referrals tab**
- Referral-in / referral-out **broken out by L1, L2, L3** (no state average lines)
- Referral funnel & top-reasons charts retained

**Outcomes tab**
- **Box indicators (last month)**: Total Deliveries, Total C-Sections, Live Births, Still Births, Maternal Deaths, Neonatal Deaths
- **Chart 1**: Total Deliveries + PPIUCD + PAIUCD (combined line trend)
- **Chart 2**: Total Deliveries + C-Section + Assisted Deliveries (combined line trend)

---

### 3. Files to create / modify

**New**
- `src/lib/scoring-rubric.ts` — L1/L2/L3 domain weights + helper to compute weighted facility score
- `src/lib/intersections.ts` — 7 intersection-preset logic + mortality flags + supervision flag
- `src/components/facility-scoring-snapshot.tsx` — snapshot inside right panel
- `src/routes/_app.hr.tsx`, `_app.referrals.tsx`, `_app.outcomes.tsx`
- `src/routes/_app.facility-infra.tsx` (renamed from facility-hr)
- `src/routes/_app.drugs.tsx` (split from drugs-referrals)

**Modified**
- `src/components/mp-outline-map.tsx` — view-mode prop, intersection highlights, facility pins, mortality pins
- `src/components/district-detail-panel.tsx` — new hierarchical view (overall → L-avg → facility list → snapshot)
- `src/components/app-sidebar.tsx` — new nav items
- `src/lib/facility-mock.ts` — add maternal/neonatal-death flags, equipment-malfunction flag, signal-function rating
- `src/lib/mock-data.ts` — separate L1/L2/L3 referral series; delivery+PPIUCD+PAIUCD + delivery+CS+assisted trends; last-month outcome totals
- `src/routes/_app.overview.tsx` — rankings table revamp + map view-mode + level filter dropdowns
- `src/routeTree.gen.ts` — regenerated by plugin

**Removed**
- `src/routes/_app.facility-hr.tsx` (replaced)
- `src/routes/_app.drugs-referrals.tsx` (replaced)
- `src/routes/_app.obs-hdu.tsx` (replaced by outcomes)

---

### 4. Open question

Before I implement: please confirm the **scoring rubric weights** (HR / Infra / Drugs / Service Outputs / Outcomes / Referrals max-points) for L1, L2, and L3 separately. The attached images aren't visible to me in this turn — if you can paste the weight table as text I'll wire it exactly; otherwise I'll proceed with reasonable placeholders that you can adjust in `scoring-rubric.ts`.
