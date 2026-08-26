# MP Maternal Health Insights

LRMIS Dashboard — Complete Build Specification

1. Project Vision

Build LRMIS (Labour Room Management Information System) — a professional, government-grade analytics dashboard for maternal health programme administrators in Madhya Pradesh, India. The system tracks performance across 52 districts, ~1,200 facilities, and multiple programme domains: facility readiness, HR, drugs & equipment, referrals, delivery outcomes, and Obs HDU.

The product must feel like a polished enterprise health analytics platform — clean, data-dense but not cluttered, calm authority in its visual tone. Think NHM programme room dashboard, not a generic SaaS template.

2. Tech Stack

React + TypeScript with Vite

Recharts for all data charts

Tailwind CSS for layout and utilities

shadcn/ui for cards, tables, badges, tooltips, sheets, dialogs, select, tabs

Lucide React for icons

Anthropic Claude API (claude-sonnet-4-20250514) for AI Query Assistant only

All other data: realistic hardcoded mock data (no backend needed)

3. Design System

3.1 Color Palette

Primary Navy:      #0F2D56   (sidebar, header, primary buttons)
Primary Teal:      #0B7B8A   (active states, accent, links)
Light Teal:        #E6F4F6   (card tint, hover backgrounds)
Surface White:     #FFFFFF   (main content background)
Surface Gray:      #F4F6F9   (page background)
Border:            #E2E8F0
Text Primary:      #1A202C
Text Secondary:    #64748B
Text Muted:        #94A3B8

Chart Blue:        #2563EB
Chart Teal:        #0891B2
Chart Indigo:      #6366F1
Chart Emerald:     #059669
Chart Amber:       #D97706
Chart Rose:        #E11D48
Chart Purple:      #7C3AED
Chart Orange:      #EA580C


Status colors — use ONLY for clear pass/fail binary states (not scores):

Success:   #16A34A   (e.g. "Certified", "Available")
Warning:   #CA8A04   (e.g. "Partial")
Danger:    #DC2626   (e.g. "Not available", "Stockout")


Score / Performance Gradient — for district maps, composite scores, ranking bars: Use a continuous gradient scale, NOT discrete red/amber/green buckets. Scores range 0–100. Map to a blue gradient:

100  →  #0F2D56  (deep navy, highest performance)
 75  →  #1E6FA8  (mid navy-blue)
 50  →  #5BAED4  (medium blue)
 25  →  #A8D4EA  (light blue)
  0  →  #E8F4FA  (near white, lowest performance)


This avoids harsh red/green stigmatization of districts and handles the reality that score differences are small (e.g. 62 vs 71 should look clearly different but both "decent").

3.2 Typography

Font: Inter (import from Google Fonts)

Page title:      24px, font-semibold, #1A202C
Section header:  16px, font-semibold, #0F2D56, uppercase tracking-wide
Card value:      32px, font-bold, #1A202C
Card label:      13px, font-medium, #64748B
Chart title:     14px, font-semibold, #1A202C
Table header:    12px, font-semibold, uppercase, #64748B, tracking-wide
Table cell:      13px, #1A202C
Badge:           11px, font-semibold


3.3 Spacing & Elevation

Page content padding: 24px

Card border radius: 12px

Chart card shadow: shadow-sm with border border-[#E2E8F0]

Section gap: 24px between sections, 16px between cards in a row

Table rows: 44px min height, alternating #FAFBFC / white row backgrounds

3.4 Component Patterns

Stat Card:

┌─────────────────────────────┐
│  [Icon]        ℹ️           │
│                             │
│  73%                        │
│  Functional FRUs            │
│                             │
│  ↑ 2.1% vs Apr 2026        │
└─────────────────────────────┘


Left border accent: 3px solid primary teal

Icon: 36px circle with light teal background

Trend delta: small text below label, green/red with arrow icon

Chart Card:

┌──────────────────────────────────────────────┐
│  Chart Title                    ℹ  [%|#]  ↓  │
│  ─────────────────────────────────────────── │
│                                              │
│         [Recharts chart here]                │
│                                              │
└──────────────────────────────────────────────┘


Title + toolbar in card header row

Toolbar right-aligned: Info tooltip icon | % / # toggle (if applicable) | Download CSV icon

Charts have 16px padding on all sides

4. Global Navigation Structure

4.1 Sidebar (left, 240px wide, collapsible to 64px icon-only)

Background: #0F2D56. Logo area at top: LRMIS wordmark + MP Government crest icon.

Nav items (with active state: left border 3px teal, teal text, light navy background):

📊  Overview & Rankings
📈  Facility & HR Indicators
💊  Drugs, Referrals & Outcomes
🏥  Obs HDU
🤖  AI Query Assistant


Bottom of sidebar: logged-in user name, role badge (State / District / Block), and a logout icon.

4.2 Top Bar (right side, 64px height)

[Breadcrumb: Overview & Rankings]    [🔔 Alerts: 3]   [Period: May 2026 🔒]   [User Avatar]


The Period badge is a read-only locked indicator on all pages except AI Assistant. It shows May 2026 in a small navy rounded badge with a lock icon — to reinforce that all indicators auto-resolve to the last completed month.

5. Login Page

Create a professional full-screen login page before the dashboard. Design:

Left panel (40% width): Deep navy background (#0F2D56). Display:

MP Government logo (placeholder crest SVG) + NHM logo placeholder

Large headline: "LRMIS" in white, 48px bold

Subheadline: "Labour Room Management Information System"

"Government of Madhya Pradesh — NHM" below in muted teal

A subtle diagonal grid pattern or soft wave in the background for texture

Right panel (60% width): White, clean form:

"Welcome back" heading

"Sign in to continue" subtext in muted color

Login Level selector — 3 tab buttons or segmented control at the top:

[  State Level  ]  [  District Level  ]  [  Block Level  ]


State Level: Username + Password only

District Level: District dropdown (all 52 MP districts) + Username + Password

Block Level: Division dropdown → District dropdown (filtered) → Block dropdown → Username + Password

All dropdowns use shadcn Select with real MP divisions and districts populated.

"Sign In" button: full width, navy background, white text, rounded-lg

Forgot password link below

Version tag at bottom: "v2.1.3 | NHM MP © 2026"

On successful login (any username/password accepted in mock mode), store login level and district/block context in React state. The dashboard should reflect this context — e.g., a District-level login sees their district pre-selected in all filters, and cannot change to another district.

6. Global Filter Panel (All Dashboard Pages)

Every dashboard page has a "Filters" button in the top bar area, right-aligned just below the top bar. It is a small button with a filter icon: ⊞ Filters. It does NOT show any always-visible filter controls — the filters live entirely inside a slide-out panel.

Filter Panel (Right Slide-Out Sheet — shadcn Sheet component)

Opens from the right side, 320px wide. Title: "Filter Data". Close button (×) top right.

Filter fields (in order):

Period — Month/Year picker. Default: May 2026 (last completed month). Show last 12 months as options. On Indicator pages, this is disabled and locked to May 2026 with a note: "Indicator pages use last completed month."

Facility Level — Multi-select checkboxes: L1, L2, L3

Facility Type — Multi-select checkboxes: DH, CHC, PHC, SHC, SC, Private (Empanelled)

Division — Single select dropdown. All 10 MP Divisions: Bhopal, Indore, Gwalior, Jabalpur, Sagar, Rewa, Ujjain, Chambal, Narmadapuram, Shahdol

District — Single select dropdown (filtered by selected Division). All 52 MP districts.

Block — Single select dropdown (filtered by selected District). Mock block names per district.

Facility — Single select searchable dropdown (filtered by selected Block/District). Shows facility name + type.

Bottom of panel:

[Apply Filters] button (navy, full width)

[Reset to Default] text link

Behavior:

When a state-level user applies a district filter, all charts and tables on the current page update to show that district's data (mock data changes per selection — use a simple lookup object per district).

A filter badge appears on the Filters button showing count of active filters: ⊞ Filters (3).

When a district-level user is logged in, the District filter is pre-set and locked (greyed out, cannot change).

When a block-level user is logged in, District and Block filters are pre-set and locked.

7. Page 1 — Overview & District Rankings

7.1 Top: 6 Summary Stat Cards (full-width row of 6)

# Label Icon Mock Value Trend 1 Districts MapPin 52 — 2 Delivery Points Building2 1,247 ↑ 3 new 3 L1 / L2 / L3 Layers 843 / 312 / 92 — 4 LR / MOT / HDU Activity 1,102 / 387 / 68 — 5 FRUs Star 218 ↑ 2.3% 6 Total Deliveries (May 2026) HeartPulse 48,312 ↑ 4.1%

7.2 Center: Madhya Pradesh District Performance Map

Render an SVG choropleth map of Madhya Pradesh showing all 52 districts as shapes. Since a full TopoJSON map may be complex, use a simplified district grid / tile map approach: arrange 52 labeled square/hexagon tiles in the rough geographic layout of MP. Each tile:

Fills with the gradient color scale (deep navy = high score, light blue = low score)

Shows district name (10px) and composite score (14px bold) inside the tile

On hover: shows a tooltip card with district name, composite score, rank, and sparklines for each domain score

On click: filters the entire page to that district's data and highlights the tile with a teal border

Below the map, show a gradient legend bar from #E8F4FA (0) to #0F2D56 (100) with labels at 0, 25, 50, 75, 100.

7.3 District Ranking Table

Title: "District Performance Ranking — May 2026"

Columns:

Rank District Division Composite Score HR Infrastructure Drugs & Supplies Outcomes Data Quality Δ vs Apr Flag

Composite Score: horizontal mini progress bar (gradient fill matching map color scale) + score number. Width of bar proportional to score.

Domain Scores (HR, Infra, Drugs, Outcomes, Data Quality): small round pill badges. Color: solid blue gradient fill matching score (not red/green/amber — use the same gradient scale). Score number in white/dark text inside pill.

Δ vs Apr: ↑ +3.2 in emerald or ↓ -1.8 in rose, small font.

Flag: Only for top 5 ("🏆 Top Performer" gold badge) and bottom 5 ("⚠ Needs Supervision" rose badge).

Table features:

Sortable columns (click header to sort asc/desc, show sort arrow icon)

Sticky header when scrolling

Search input above table: "Search district..."

Pagination: 15 rows per page with prev/next

Export button (top-right of table header bar): ↓ Export CSV — downloads full 52-district table as CSV with all columns

Populate with all 52 real MP districts with consistent mock data.

7.4 Bottom: Two Highlight Panels Side by Side

Left — 🏆 Top 5 Districts Horizontal bar chart (gold-teal gradient bars). Each bar: district name, rank badge (medal emoji for 1–3), score. Clean card with subtle gold top-border accent.

Right — ⚠ Supervision Required (Bottom 5) Same horizontal bar chart (rose-tinted bars). For each district, show the single weakest domain with a small label: e.g. "Weakest: Drugs (31)". A note at bottom: "These districts are flagged for supervisory visits in June 2026."

8. Page 2 — Facility & HR Indicators

Header: Section title + "Period: May 2026 🔒" badge. Filters button top-right.

Section A — Facility Profile

Section header: "Facility Profile" with a small building icon, navy, uppercase tracking-wide

Row 1: 5 Stat Cards (as described in design system)

Indicator Value Definition (tooltip) Functional FRUs 73% FRUs meeting GoI criteria: DH ≥10 C-sections/month, CHC ≥5 C-sections/month Functional Delivery Points 68% L1 ≥3 deliveries/month, L2 ≥10 deliveries/month LaQshya Certified 41% LR fully certified + LR partially certified + MOT fully + MOT partially Signal Functions (BEmONC/CEmONC) 56% Facilities able to perform all emergency obstetric care functions Blood Availability at FRUs 61% FRUs with functional blood transfusion support

Row 2: 2 Stat Cards

Indicator Value Ambulance Availability 54% Full Kit Availability 38%

Chart A1 — Beds by Service Area (Horizontal Bar)

Title: "Bed Availability by Service Area"

Horizontal bar chart, sorted descending

Y-axis: ANC Ward (1,842), Birth Waiting Room (1,124), Labour Room Tables (987), OT Tables MOT (412), PNC Ward (2,103), Post-Op Ward (634), Pre-Op Ward (521), Obs HDU (312)

% / # toggle

Click any bar: Slides out the bottom facility panel listing up to 20 facilities with that area's bed count, district, and facility type. Panel has ↓ Download CSV button. CSV columns: Facility Name, District, Block, Facility Type, Bed Count.

Chart A2 — Regulatory Approvals (Stacked Bar by Facility Type)

Title: "Regulatory Approvals Status"

Grouped stacked bar: X-axis = DH / CHC / PHC / SHC

Each group stacked: Fire NOC (Compliant in teal, Non-compliant in rose), SUMAN Branding (navy / light blue), Pollution Control NOC (indigo / light indigo)

% / # toggle

Click a stack segment: Slides up the facility list panel at page bottom. Columns: Facility Name, District, Facility Type, Fire NOC (✓/✗), SUMAN Branding (✓/✗), PCB NOC (✓/✗). Download CSV button.

Chart A3 — Functional FRUs & Delivery Points Trend (Dual Line)

Title: "Monthly Trend — Functional FRUs & Delivery Points (%)"

Dual area-line chart, 12 months Jul 2025–May 2026

Line 1: Functional FRUs (teal), Line 2: Delivery Points (indigo)

Shaded fill under each line (10% opacity)

Reference line at 70% labeled "Target"

Section B — HR & Training

Section header: "Human Resources & Training" with Users icon

Row: 4 Stat Cards

Indicator Value Facilities Meeting Staffing Norms 44% Facilities with Zero Specialist 28% Overall HR Vacancy Rate 34% Staff on Contractual/Bonded 52%

Chart B1 — HR Vacancy Rate by Cadre (Vertical Bar)

Title: "HR Vacancy Rate by Cadre (%)"

Bars filled using gradient scale (high vacancy = more red-toned, use rose/amber per bar individually based on value)

X-axis: Gynaecologist (62%), Anaesthetist (71%), Staff Nurse (28%), ANM (19%), MO (41%), LT (33%), OT Technician (55%)

Reference line at 30% ("Acceptable threshold") in dashed amber

% / # toggle (switches to: Sanctioned vs In-position grouped bars when in # mode)

Tooltip: shows Sanctioned, In-position, Vacancy count, Vacancy %

Chart B2 — Training Coverage by Programme (Horizontal Bar + Drill-down)

Title: "Training Coverage by Programme"

Horizontal bars sorted descending by coverage %

Trainings: Dakshata (68%), NSSK (54%), PPIUCD (47%), MgSO4 Admin (39%), SBA (61%), EmOC (29%), Blood Transfusion (44%), Laparoscopy (22%)

Click any training bar → chart transitions (animated) to show that training's coverage split by cadre (Gynaec, Anaesthetist, Staff Nurse, ANM, MO shown as horizontal bars)

Breadcrumb appears above chart: "Training Coverage › Dakshata — by Cadre" with ← All Trainings link

% / # toggle works at both levels

Chart B3 — Staff Employment Type by Cadre (Stacked Horizontal Bar)

Title: "Staff Employment Type Distribution"

Y-axis: Gynaec, Anaesthetist, Staff Nurse, ANM, MO, LT

Stacks: Permanent (navy), NHM Contractual (teal), State Contractual (indigo), Bonded (amber), Outsourced (muted)

% / # toggle

Click any cadre row → chart transitions to district-wise breakdown for that cadre (15 districts shown by default, sortable)

Breadcrumb: "Employment Type › Staff Nurse — by District" with ← All Cadres

Chart B4 — Staff Availability Trend (Multi-line)

Title: "Staff Availability Trend (Last 12 Months)"

Three lines: Gynaecologist (%), Anaesthetist (%), Staff Nurse (%)

X-axis: Jul 2025 – May 2026

Shaded fills, with dots on data points

Legend below chart

9. Page 3 — Drugs, Referrals & Outcomes

Header: Same structure, period badge, filters button.

Section A — Infrastructure Compliance

Section header: "Infrastructure Compliance"

Chart C1 — Infrastructure Compliance by Area + Facility Type (Grouped Vertical Bar)

Title: "Infrastructure Compliance Score by Service Area"

Grouped bars: each X-axis group = ANC Ward / MOT / LR / PNC Ward / Obs HDU

Within each group: 3 bars — DH (navy), CHC (teal), PHC (indigo)

% / # toggle

Click any bar → transitions to category breakdown within that area: Privacy, Ambience, Ventilation, Space Management, Beds, Washroom, Handwashing, Miscellaneous — shown as a horizontal bar chart for the selected facility type

Breadcrumb: "Infrastructure › Labour Room — DH — Category Breakdown" with ← Back

Drill-down also shows a facility list panel at bottom with columns: Facility, District, Overall Compliance %, individual category scores. Download CSV.

Section B — Drugs & Equipment

Section header: "Drugs & Equipment"

Row: 3 Stat Cards

Indicator Value Full Kit Availability 38% Chronic Stockout Facilities (≥3 months) 12% Non-Functioning Equipment Rate 22%

Chart D1 — Stockout Trend by Category (Triple Line Chart)

Title: "Facilities Reporting Stockout — Monthly Trend"

Three lines: Essential Medicines (rose), Consumables (amber), Equipment (indigo)

X-axis: Jul 2025 – May 2026

Y-axis: % facilities with stockout

Reference band shaded in light rose for months where Essential Medicines stockout > 15%

Click any data point → facility list panel slides up at page bottom. Columns: Facility, District, Block, Stockout Category, Months Consecutive, Last Reported. Download CSV button.

Section C — Referrals

Section header: "Referrals"

Charts E1 & E2 — Referral Trend (Two Line Charts, side by side)

Left: "Referral-In Rate" — % of total deliveries, 12-month line, area fill (teal)

Right: "Referral-Out Rate" — same structure, area fill (indigo)

Both show a state average reference line

Charts E3 & E4 — Referral Reasons (Two Horizontal Bar Charts, side by side)

Left: "Referral-In: Reasons" — bars for APH, PPH, Severe Anaemia, Sepsis, Pre-eclampsia, Eclampsia, Obstructed Labour, Previous LSCS, Fetal Distress, Other

Right: "Referral-Out: Reasons" — same categories

% / # toggle on each

Click any bar → facility/district panel at bottom with list view. Download CSV.

Section D — Delivery Outcomes

Section header: "Delivery Outcomes"

2×3 Grid of Trend Charts (each: area-line, 12 months, compact height 200px)

Position Chart Title Notes Top-left Total Deliveries Count axis, not % Top-right Caesarean Section Rate % + target reference line at 15% Mid-left Normal Delivery Rate % Mid-right Assisted Vaginal Delivery Rate % Bottom-left Live Birth Rate Two lines: Male (navy), Female (rose) Bottom-right PPIUCD Insertion Rate % of deliveries

Below grid: Single sparkline bar chart — "Hysterectomy Count by Month" (compact, 120px height, 12 months).

Each chart card has info tooltip, download CSV icon. % / # toggle on percentage charts.

Section E — Data Quality

Section header: "Data Quality"

Charts F1 & F2 — Side by Side

Left — Reporting Completeness Trend:

Line chart, 12 months, Y-axis = % of expected reports submitted on time

Reference line at 90% ("Target")

Right — Facility Reporting Gap (Non-Reporters):

Horizontal bar chart, top 15 districts with most non-reporting facilities (≥2 months consecutive)

Bars in rose/amber gradient by severity

Click any district bar → facility list panel at bottom. Columns: Facility, Block, Months Non-Reported, Last Submission Date. Download CSV.

10. Page 4 — Obs HDU

Faithfully replicates the reference screenshot. The layout and data exactly match what was provided.

Header row: "Obs HDU" title + Period badge "May 2026 🔒" + Filters button

All 4 charts have: Info icon (ℹ) and Download (↓) icons top-right of each chart card. The ↓ icon downloads chart as PNG. Additionally show a ↓ CSV icon specifically for the diagnosis and outcome bar charts.

Chart 1 — Month Wise Admission (Full-width Line Chart)

Data: 1520 (Jul-25), 1463 (Aug), 1420 (Sep), 1409 (Oct), 1335 (Nov), 1415 (Dec), 1348 (Jan-26), 1211 (Feb), 1267 (Mar), 1103 (Apr), 965 (May), 16 (Jun — partial, shown as dashed)

Data labels on each point, rounded dots, teal line, soft teal area fill

The June partial point is styled differently (dashed line, open circle, tooltip: "Partial month — data as of June 2")

Y-axis: 0–2000. X-axis: monthly labels.

Row 2 — Two charts (50%/50%)

Left — Condition/Diagnosis at Admission (Horizontal Bar)

Categories (sorted descending): Other (229), Severe Anaemia (197), Pregnancy Induced Hypertension (127), Post Surgical/Post-Op (82), Previous LSCS (66), Severe Pre-Eclampsia (40), PPH (37), Pre-Eclampsia (36), Abortion (30), Fetal Condition (26), Obstructed Labour (18), Eclampsia (17)

Navy/teal gradient bars (darker for higher counts), data labels at bar ends

% / # toggle

Right — Bed Occupancy Rate Obs HDU (Line Chart)

Data: 47.11, 41.72, 43.07, 39.52, 40.88, 38.99, 42.4, 41.73, 41.57, 33.49, 37.03, 1 (Jun partial)

Data labels on each point, teal line, area fill, Jun shown as dashed partial

Y-axis: 0–60, reference line at 40% ("Target occupancy")

Row 3 — Two charts (50%/50%)

Left — Outcome of Patient (Horizontal Bar)

Categories: Shifted to Maternity Ward (464), Discharged (171), Shifted to Other Ward (83), LAMA (60), Referred Out (45), Death (1)

Color code: Shifted/Discharged = teal/navy (positive), LAMA = amber, Referred Out = indigo, Death = rose

Data labels at bar ends, % / # toggle

Right — Critical Equipment Availability (Stacked Bar)

Equipment: BIPAP, Infusion Pump, Ventilator, DVT Pump, Defibrillator, Blood Transfusion

Two stacks per equipment: Yes (teal #0891B2) and No (rose #E11D48)

Values: BIPAP (Yes:0, No:959), Infusion Pump (Yes:51, No:914), Ventilator (Yes:4, No:961), DVT Pump (Yes:2, No:963), Defibrillator (Yes:1, No:964), Blood Transfusion (Yes:318, No:647)

Legend: ● Yes ● No at bottom

Data labels inside bars where space allows

11. Page 5 — AI Query Assistant

Title: "AI Query Assistant" Subtitle: "Ask natural language questions about LRMIS data. Get text insights and auto-generated charts."

Layout

┌──────────────────────────────────────────────────────────┐
│  💡 Suggested queries                                    │
│  [SUMAN vs Infra Gap]  [Referrals + Stockouts]  [Top Drugs Stockout] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Chat message area — scrollable, grows upward]          │
│                                                          │
│  AI response cards contain:                              │
│    - Text paragraphs with bolded numbers                 │
│    - Dynamic Recharts chart rendered inline              │
│    - "Download data as CSV" link below chart             │
│                                                          │
└──────────────────────────────────────────────────────────┘
│  ┌──────────────────────────────────┐  ┌─────────────┐  │
│  │ Type your question...            │  │   Ask  →    │  │
│  └──────────────────────────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────┘


Suggested query pills (pill-shaped buttons, navy outline style):

Label: "SUMAN vs Infrastructure Gap" Full query: "Show facilities where SUMAN branding is complete but infrastructure compliance score is below 60%"

Label: "Referral Load + Drug Stockouts" Full query: "Which districts have the highest referral-in load at their District Hospital but are also reporting drug stockouts?"

Label: "Top Stockout Drugs This Quarter" Full query: "Show the top 10 drugs with highest stockout frequency across all facilities this quarter"

Chat UI

User message bubble: Right-aligned, navy background (#0F2D56), white text, rounded-2xl with slight shadow

AI response card: Left-aligned, white card with shadow and teal left border (3px). Contains:

Avatar: small "AI" badge in teal circle

Text response rendered as formatted paragraphs (bold numbers in teal)

Dynamic Recharts chart rendered below text inside the same card (height 280px)

Small ↓ Download CSV link below chart (exports mock data array as CSV)

Loading state: Show a pulsing skeleton card with "Analysing LRMIS data..." text and animated dots

Anthropic API Integration

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: LRMIS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userQuery }]
  })
});


API key via import.meta.env.VITE_ANTHROPIC_API_KEY.

System prompt constant LRMIS_SYSTEM_PROMPT:

You are an expert data analyst for LRMIS (Labour Room Management Information System) — the maternal health monitoring platform of NHM Madhya Pradesh. You have access to May 2026 data across 52 districts and ~1,200 facilities in MP.

When answering user queries:
1. Give a 2-3 paragraph analytical response. Use specific MP district names, facility names, and realistic numbers. Bold important figures using **number** markdown.
2. Always end your response with a ```json code block containing a chart specification:
{
  "chartType": "bar" | "horizontalBar" | "line",
  "title": "Chart title",
  "data": [{ "name": "label", "value": 0, ... }],
  "keys": ["value"],
  "colors": ["#hex"]
}
Use realistic mock values consistent with the analysis text. Prefer horizontalBar for district/facility lists, bar for categories, line for trends.


Response rendering: Parse the ```json block from the response text, strip the markdown fences, JSON.parse it, and render:

horizontalBar → <BarChart layout="vertical"> with <YAxis type="category"> and <XAxis type="number">

bar → standard <BarChart>

line → <LineChart> with <CartesianGrid> and area fill

Conversation is stateful within the session — maintain a messages array and pass full history on each subsequent query.

12. CSV Export — Universal Pattern

Every place where data is displayed in a list, table, or after clicking a chart bar, show a ↓ Download CSV button. This applies to:

District ranking table (full table export button)

Every facility list panel that slides up after clicking a chart bar

AI Query Assistant chart data

Obs HDU charts (diagnosis list, outcome list)

Implementation: Use a utility function downloadCSV(data: object[], filename: string) that converts the array to comma-separated text and triggers a browser download. This function should be reusable and called wherever download is needed.

13. Mock Data Specification

Use these 52 real MP district names. Assign each a plausible composite score (range 45–88) and domain scores that are internally consistent. Districts with low composite scores should have identifiably weak domains.

10 MP Divisions and their districts:

Bhopal: Bhopal, Raisen, Sehore, Rajgarh, Vidisha
Indore: Indore, Dhar, Jhabua, Alirajpur, Barwani, Khargone (W. Nimar), Burhanpur
Gwalior: Gwalior, Shivpuri, Guna, Ashoknagar, Datia
Chambal: Morena, Bhind, Sheopur
Jabalpur: Jabalpur, Katni, Mandla, Dindori, Narsinghpur, Seoni, Chhindwara, Balaghat
Sagar: Sagar, Damoh, Panna, Chhatarpur, Tikamgarh, Niwari
Rewa: Rewa, Satna, Sidhi, Singrauli, Umaria, Shahdol, Anuppur
Ujjain: Ujjain, Dewas, Shajapur, Agar Malwa, Mandsaur, Neemuch, Ratlam
Narmadapuram: Hoshangabad (Narmadapuram), Betul, Harda
Shahdol (subgroup): Maihar, Mauganj (newer districts, include them under Rewa division for mock purposes)


For each district, maintain a districtData object with: compositeScore, hrScore, infraScore, drugsScore, outcomesScore, dataQualityScore, totalDeliveries, cSection%, referralInRate, referralOutRate, functionalFRUs%, functionalDPs%, vacancyRate, stockoutFacilities%, reportingRate%.

Make sure top 5 districts (Bhopal, Indore, Jabalpur, Ujjain, Gwalior) score 78–88, and the bottom 5 (Sheopur, Dindori, Alirajpur, Sidhi, Singrauli) score 45–54, with smooth distribution in between.

14. Quality Requirements

No TypeScript any types — define proper interfaces for all data structures

No console errors in the final build

All charts are responsive (use ResponsiveContainer width="100%" height={300})

All tooltips are informative: show the indicator name, value (both % and count where applicable), district/facility name, and comparison to state average

All loading states use skeleton placeholders (shadcn Skeleton component)

Error boundaries around chart components

Smooth CSS transitions on: filter panel open/close, drill-down chart transitions, facility panel slide-up

Mobile responsive: sidebar collapses, charts stack vertically below 768px

Consistent icon usage throughout: Lucide React only, no mixed icon libraries

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://madhya-pradesh-maternal-health.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ec1af955-dc18-43e7-bfe4-a95d7cc6d735).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
