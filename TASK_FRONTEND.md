# TASK_FRONTEND.md — KOLVault Frontend

## Context
Backend is complete (Phases 1–5). Next.js 14 App Router, TypeScript strict. Frontend lives in the same repo.

## Stack
- **Styling:** Tailwind CSS v3 with full custom config (NO shadcn — too rounded/generic)
- **Fonts:** next/font — Space Grotesk (headings), IBM Plex Mono (data/numbers), Inter (labels)
- **Icons:** lucide-react
- **Charts:** recharts (sparklines)
- **Animation:** framer-motion (minimal, purposeful)
- **State:** React context for auth + toast
- **API calls:** native fetch to `/api/*` routes

## Install Required Packages
```
npm install recharts framer-motion lucide-react
```

---

## Design System (implement EXACTLY)

### Tailwind Config (`tailwind.config.ts`)
```ts
colors: {
  bg: { DEFAULT: '#0A0010', surface: '#100020', elevated: '#15002E' },
  accent: { DEFAULT: '#7B2FBE', bright: '#A855F7', glow: '#C084FC' },
  border: { DEFAULT: '#2D0E5A', active: '#7B2FBE', muted: '#1A0035' },
  text: { primary: '#F0E6FF', secondary: '#9B7EC8', muted: '#4A3566' },
  positive: '#22D3A0',
  negative: '#FF4466',
  warning: '#F59E0B',
}
borderRadius: { DEFAULT: '0px', none: '0px' }  // NO ROUNDED CORNERS ANYWHERE
```

### Global CSS (`app/globals.css`)
```css
* { border-radius: 0 !important; }
body { background: #0A0010; color: #F0E6FF; }
.clip-corner-tr { clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%); }
.clip-corner-bl { clip-path: polygon(0 0, 100% 0, 100% 100%, 16px 100%, 0 calc(100% - 16px)); }
.glow-border { box-shadow: 0 0 12px rgba(123, 47, 190, 0.3); border-color: #7B2FBE; }
.shimmer { background: linear-gradient(90deg, #100020 25%, #15002E 50%, #100020 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
.mono { font-family: 'IBM Plex Mono', monospace; }
.stat-number { font-family: 'IBM Plex Mono', monospace; color: #C084FC; }
.positive { color: #22D3A0; }
.negative { color: #FF4466; }
```

---

## Font Setup (`app/layout.tsx` — update existing)
```tsx
import { Space_Grotesk, IBM_Plex_Mono, Inter } from 'next/font/google'
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' })
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-mono' })
const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
// Apply all 3 variables to <html>
```

---

## File Structure to Create

```
app/
  (marketing)/
    page.tsx              — Landing page
    layout.tsx            — Marketing layout (no sidebar)
  (auth)/
    login/page.tsx
    register/page.tsx
    layout.tsx            — Auth layout (centered, no sidebar)
  (app)/
    layout.tsx            — App shell: sidebar + top bar + main content
    dashboard/page.tsx    — Role-based redirect
    leaderboard/page.tsx  — KOL leaderboard (public + logged in KOL)
    deals/
      page.tsx            — Deal browser (KOL) / Deal manager (Project)
      create/page.tsx     — Create deal (Project only)
      [id]/page.tsx       — Deal detail + applications
    profile/page.tsx      — Account settings

components/
  layout/
    Sidebar.tsx           — Left nav, collapsible
    TopBar.tsx            — Fixed top bar with ticker + wallet
    BottomNav.tsx         — Mobile bottom tabs
  kol/
    LeaderboardTable.tsx  — Main KOL ranking table
    KOLProfileCard.tsx    — Expandable inline profile
    CallFeed.tsx          — Right panel live call feed
    StatBar.tsx           — Platform stats strip
    Sparkline.tsx         — 30d performance mini chart
  deals/
    DealTable.tsx         — Deal listing table (KOL or Project view)
    CreateDealForm.tsx    — Multi-step deal creation
    ApplicationTable.tsx  — Applications for a deal (Project view)
    ApplyModal.tsx        — KOL apply form
  ui/
    Toast.tsx             — Toast notification system
    FilterBar.tsx         — Sharp toggle filter buttons
    WalletButton.tsx      — Connect wallet button
    LoadingShimmer.tsx    — Pulsing placeholder
    EmptyState.tsx        — "NO DATA FOUND" state
    StatCard.tsx          — Reusable stat card with clip-path
    Badge.tsx             — Sharp corner badge
    Button.tsx            — Base button component (all variants)
    Input.tsx             — Base input (dark, sharp)
    Table.tsx             — Base table with sticky headers

lib/
  context/
    AuthContext.tsx       — User session state (reads from /api/auth/me)
    ToastContext.tsx      — Global toast state

hooks/
  useAuth.ts             — Auth context consumer
  useToast.ts            — Toast context consumer
  useCountUp.ts          — Number count-up animation hook
```

---

## Component Specifications

### `components/layout/Sidebar.tsx`
- Fixed left, `w-[60px]` collapsed, `w-[220px]` expanded
- Toggle on hover (desktop) or button click
- Background: `#100020`, right border: `1px solid #2D0E5A`
- Top: KOLVault logo (text + icon — use a ◈ symbol or similar geometric shape)
- Nav items with lucide icons: Home, BarChart2, Briefcase, User, Settings
- Active item: left border `3px solid #7B2FBE`, background `#15002E`
- Bottom: Connect Wallet area + user avatar if logged in
- Collapsed: icons only, centered; Expanded: icon + label
- Framer-motion width transition: 150ms ease

### `components/layout/TopBar.tsx`
- Fixed top, `h-[48px]`, full width minus sidebar
- Background: `#100020`, bottom border: `1px solid #2D0E5A`
- Left: page title (dynamic, e.g. "LEADERBOARD")
- Center: scrolling ticker strip — continuous horizontal scroll of platform stats
  - Format: `KOLS TRACKED · 847 ❙ CALLS THIS WEEK · 3,241 ❙ AVG WIN RATE · 61.4% ❙ PLATFORM VOLUME · $2.4M`
  - Use CSS animation `@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }` (duplicate content for seamless loop)
  - Text in `text-muted`, numbers in `stat-number`
- Right: WalletButton + notification bell (lucide Bell) + user avatar

### `components/layout/BottomNav.tsx`
- Only visible on `<768px` (mobile)
- Fixed bottom, `h-[56px]`, background `#100020`, top border `1px solid #2D0E5A`
- 4 items: Home (chart icon), Deals (briefcase), Leaderboard (list), Profile (user)
- Active: icon in `#A855F7`, label visible; inactive: icon in `#4A3566`

### `components/kol/StatBar.tsx`
- Horizontal strip below TopBar
- 6 stats in a row: `KOLS TRACKED | CALLS THIS WEEK | AVG WIN RATE | TOP ROI | ACTIVE DEALS | PLATFORM VOLUME`
- Each stat: label in ALL CAPS `text-muted text-[10px] tracking-widest`, value in `stat-number text-2xl font-bold mono`
- Separated by `1px solid #1A0035` vertical dividers
- Use `useCountUp` hook — numbers animate from 0 to value on mount (800ms)
- Use mock data initially (will connect to API later)

### `components/kol/LeaderboardTable.tsx`
- Full-width horizontal scroll table
- Sticky column headers (`position: sticky; top: 0; background: #100020; z-index: 10`)
- Columns: RANK | KOL | HANDLE | WIN RATE | CALLS | AVG ROI | BEST CALL | 30D | ACTION
- Column header: ALL CAPS, `text-muted text-[11px] tracking-widest`

**Row design:**
- Height: `64px`
- Background: `#100020`, border-bottom `1px solid #1A0035`
- Hover: background `#15002E`, translateY(-1px) 150ms, left border glows
- Left border: `3px solid transparent` default; `3px solid #7B2FBE` on hover; `3px solid #A855F7` for top 10
- Rank column: rank number in large `text-6xl text-[#4A3566] font-bold mono opacity-30` positioned absolutely as watermark behind KOL name
- Rank 1-3: apply `.clip-corner-tr` to rank badge area
- KOL column: avatar (32px square, `object-cover`) + name (bold, `#F0E6FF`) + stacked
- Win Rate: large `text-2xl mono` — green if >60%, red if <40%, normal otherwise
- AVG ROI: `mono positive` or `mono negative` with +/- prefix
- 30D sparkline: use `<Sparkline />` component (recharts LineChart, 60px wide, 32px tall, no axes, no tooltip, green/red line based on trend)
- ACTION: sharp "FOLLOW" button (unfollowed: outline `#2D0E5A`; followed: filled `#7B2FBE`)

**On row click:** expand `<KOLProfileCard />` inline below the row (accordion, framer-motion AnimatePresence, 200ms)

### `components/kol/KOLProfileCard.tsx`
Inline expanded panel below a leaderboard row:
- Background `#0A0010`, border `1px solid #2D0E5A`, border-top `2px solid #7B2FBE`
- 3-column layout: left (bio + stats), center (recent calls list), right (performance chart)
- All-time stats: Win Rate, Total Calls, Total ROI, Best Call — each in a `<StatCard />`
- Recent calls: list of call cards — token name (mono bold), entry price vs current price, % change (positive/negative), time ago
- Performance chart: recharts AreaChart, area fill `rgba(123, 47, 190, 0.15)`, stroke `#7B2FBE`, no grid lines, minimal axes

### `components/kol/CallFeed.tsx`
Right side panel (4 columns on desktop):
- Fixed-height scrolling feed
- Header: "LIVE CALLS" in ALL CAPS muted + pulsing green dot (CSS animation)
- Each entry (every ~3s new item animates in from top, framer-motion):
  - KOL avatar (24px) | bold name | "called" | **$TOKEN** (accent bright) | entry price → current price | time ago
  - Row background: `rgba(34, 211, 160, 0.05)` if in profit, `rgba(255, 68, 102, 0.05)` if down
  - Monospace font throughout
- Loading state: 5 shimmer rows

### `components/ui/FilterBar.tsx`
Sharp toggle button group:
```
[ALL] [TOP GAINERS] [MOST CALLED] [NEW KOLS] [DEGEN] [BLUE CHIP]
```
- Each: `px-4 py-2 text-[11px] tracking-widest ALL-CAPS border border-[#2D0E5A]`
- Inactive: `background: transparent, color: #9B7EC8`
- Active: `background: #7B2FBE, color: #F0E6FF, border-color: #7B2FBE`
- No gap between buttons — they touch to form a continuous strip
- 150ms background transition

### `components/ui/Button.tsx`
Variants:
- **primary:** `bg-accent text-white border border-accent hover:bg-accent-bright` + glow on hover
- **outline:** `bg-transparent border border-[#2D0E5A] text-text-secondary hover:border-accent hover:text-text-primary`
- **ghost:** `bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface`
- **danger:** `bg-negative/10 border border-negative text-negative hover:bg-negative/20`
- All: NO border-radius, `text-[12px] tracking-widest font-medium`, 150ms transitions

### `components/ui/Input.tsx`
- Background `#100020`, border `1px solid #2D0E5A`
- Focus: `border-color: #7B2FBE, box-shadow: 0 0 8px rgba(123,47,190,0.2), outline: none`
- Placeholder: `#4A3566`
- Text: `#F0E6FF`, mono font for number inputs
- Label: ALL CAPS, `text-[10px] tracking-widest text-muted`, above input

### `components/ui/Toast.tsx`
Global toast via ToastContext:
- Position: `fixed top-4 right-4 z-50`
- Each toast: `min-w-[280px] border-l-4 bg-[#100020] border border-[#2D0E5A] px-4 py-3`
- Border-left color by type: `#7B2FBE` (info), `#22D3A0` (success), `#FF4466` (error), `#F59E0B` (warning)
- framer-motion: slide in from right (x: 100 → 0), fade out (opacity: 1 → 0) after 3s
- Max 3 toasts stacked

### `components/ui/WalletButton.tsx`
- Not connected: `border border-[#2D0E5A] text-text-secondary` with Phantom icon
- Text: "CONNECT WALLET" tracking-widest
- Connected: shows truncated address `AbCd...XyZ9` in mono, green dot indicator
- On click: for now just shows a "Coming Soon" toast — wallet connection is a Phase 2 feature

### `components/ui/LoadingShimmer.tsx`
- Accepts `width`, `height` props
- Renders a div with `.shimmer` class
- Used as skeleton placeholder for tables, cards, stats

### `components/ui/EmptyState.tsx`
- Centered in container
- Dashed border box `border border-dashed border-[#2D0E5A]`
- Text: `NO DATA FOUND` in mono, `text-muted text-[11px] tracking-widest`
- Optional subtext prop

### `components/ui/StatCard.tsx`
- Background `#100020`, border `1px solid #2D0E5A`
- Apply `.clip-corner-tr` or `.clip-corner-bl` (prop)
- Label: ALL CAPS muted tiny
- Value: large mono neon accent
- Optional: delta (+ or - vs previous period) in positive/negative

### `components/deals/DealTable.tsx`
Same table energy as LeaderboardTable but for deals:
- Columns: # | PROJECT | BUDGET | KPI TARGET | DEADLINE | APPLICANTS | STATUS | ACTION
- Status badge: sharp corner, color-coded:
  - OPEN: `border-positive text-positive`
  - IN_PROGRESS: `border-accent text-accent`
  - COMPLETED: `border-muted text-muted`
  - DISPUTED: `border-negative text-negative`
- KOL view ACTION: "APPLY" button (disabled if already applied — shows "APPLIED" in muted)
- Project view ACTION: "MANAGE" button → links to deal detail

### `components/deals/CreateDealForm.tsx`
Multi-step form (3 steps):
- Step indicator: 3 sharp horizontal segments at top, active segment filled `#7B2FBE`
- Step 1 — Basic Info: Title, Description, Requirements (all `<Input />`)
- Step 2 — Economics: Budget USDC (number input with `$` prefix in mono), KPI Target (metric selector + target number + window days), Deadline (date input), Max Applications
- Step 3 — Review: Show all entered data in a terminal-style summary block, confirm button
- Navigation: BACK / NEXT / SUBMIT buttons (primary variant)
- Live validation with Zod schemas (same ones used in API)

### `components/deals/ApplicationTable.tsx`
For project owners viewing applications to their deal:
- Columns: KOL | WIN RATE | SCORE | TIER | PITCH (truncated) | PROPOSED RATE | STATUS | ACTION
- ACCEPT / REJECT buttons per row (disabled if deal already has accepted KOL)
- On ACCEPT: confirm dialog (not modal — inline expansion) → call `/api/deals/[id]/applications/[appId]` PATCH

### `components/deals/ApplyModal.tsx`
Not actually a modal — renders as an inline panel below the deal row:
- `<textarea>` for pitch (min 50 chars, counter shown)
- Optional proposed rate input
- SUBMIT APPLICATION button
- Character counter in mono muted

---

## Pages

### `app/(marketing)/page.tsx` — Landing Page

Sections:
1. **Hero** — Full viewport height, asymmetric layout:
   - Left 60%: headline (Space Grotesk bold, large), subtext, two CTAs (LAUNCH APP + LEARN MORE)
   - Right 40%: mock KOL leaderboard snapshot (static, styled exactly like the real table)
   - Background: subtle diagonal gradient from `#0A0010` to `#100020`
   - Bottom edge: `.clip-corner-bl` CSS clip creating a diagonal cut into the next section

2. **Stat Bar** — 6 platform stats (mock data), same `<StatBar />` component

3. **Features** — 3 cards in asymmetric grid (8+4, then 4+8 alternating):
   - "TRACK ALPHA" | "VERIFY PERFORMANCE" | "STAKE ON SIGNAL"
   - Each card: `<StatCard />` with icon, title, 2-line description

4. **How It Works** — 3 steps in a horizontal strip separated by `›` arrows:
   - CONNECT → TRACK KOLS → EARN FROM ALPHA
   - Step numbers in huge muted background watermark style

5. **CTA** — Full-width dark strip, headline + LAUNCH APP button

### `app/(auth)/login/page.tsx` — Login

- Centred card (`max-w-[420px]`) on full-screen dark bg
- Header: ◈ KOLVAULT logotype
- Form: email + password `<Input />`s
- SIGN IN button (primary, full width)
- "No account? REGISTER" link
- Error state: toast + border-negative on failed field
- On success: redirect to `/dashboard`

### `app/(auth)/register/page.tsx` — Register

Step 1 — Role selection:
- Two large cards side by side: **PROJECT** | **KOL**
- Each card: icon, title, 2-line description of what they can do
- Selected card: `glow-border` active state
- Cards use `.clip-corner-tr`

Step 2 — Details:
- Email, Password, Confirm Password
- If KOL selected: also Twitter Handle field
- COMPLETE REGISTRATION button

### `app/(app)/layout.tsx` — App Shell

```tsx
<div className="flex h-screen bg-bg overflow-hidden">
  <Sidebar />
  <div className="flex-1 flex flex-col overflow-hidden">
    <TopBar />
    <main className="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>
  <BottomNav /> {/* mobile only */}
  <ToastContainer />
</div>
```

- Wrap with `<AuthProvider>` and `<ToastProvider>`
- On mount: fetch `/api/auth/me`, store user in AuthContext
- If not authenticated: redirect to `/login`

### `app/(app)/leaderboard/page.tsx` — KOL Leaderboard

Layout:
```
[StatBar - full width]
[FilterBar - full width]
[LeaderboardTable - 8 cols] [CallFeed - 4 cols]
```

- `<FilterBar />` categories: ALL | TOP GAINERS | MOST CALLED | NEW KOLS | DEGEN | BLUE CHIP
- Use mock data for KOLs (20 entries) — real API connection Phase 2
- LeaderboardTable takes up 8/12 columns
- CallFeed takes 4/12 columns, fixed height with scroll

### `app/(app)/deals/page.tsx` — Deals

Role-based rendering:
- **If role === 'kol':** Shows `<DealTable />` with open deals, filter bar (ALL | HIGH BUDGET | CLOSING SOON | APPLIED)
- **If role === 'project':** Shows their own deals + "CREATE DEAL" button top right

### `app/(app)/deals/create/page.tsx` — Create Deal
- Just renders `<CreateDealForm />`
- Back button top left

### `app/(app)/deals/[id]/page.tsx` — Deal Detail

3-section layout:
1. Deal header: title, status badge, budget, KPI target — full width
2. Description + requirements — left 8 cols
3. `<ApplicationTable />` (project) or apply section (KOL) — right 4 cols

### `app/(app)/dashboard/page.tsx`
Redirect based on role:
- Project → `/deals`
- KOL → `/leaderboard`

### `app/(app)/profile/page.tsx` — Profile
- Avatar (initials in accent square), email, role badge
- Form to update: display name, Twitter handle, Solana wallet address (KOL only)
- Save button → PATCH to relevant profile endpoint

---

## Context & Hooks

### `lib/context/AuthContext.tsx`
```tsx
interface AuthUser { id: string; email: string; role: 'project' | 'kol' | 'admin' }
interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  logout: () => Promise<void>
}
```
- On mount: fetch `/api/auth/me`, set user
- `logout`: POST to `/api/auth/logout`, clear user, redirect to `/login`

### `lib/context/ToastContext.tsx`
```tsx
interface Toast { id: string; type: 'info'|'success'|'error'|'warning'; message: string }
interface ToastContextValue { addToast: (type, message) => void }
```

### `hooks/useCountUp.ts`
```tsx
// Animates a number from 0 to `end` over `duration` ms
function useCountUp(end: number, duration: number = 800): number
```
Use requestAnimationFrame for smooth animation.

---

## Mock Data

Create `lib/mock/kols.ts` and `lib/mock/deals.ts` with realistic mock data:

**KOL mock data (20 entries):**
- Names: DegenKing, SolAlpha, WhaleWatcher, etc.
- Win rates: 45–78%
- Total calls: 50–800
- AVG ROI: -12% to +340%
- Best call: various token names (BONK, JTO, WIF, etc.)
- Sparkline data: 30 data points (random realistic trend)

**Deal mock data (10 entries):**
- Various budgets ($500 to $50,000 USDC)
- KPI targets: views, holders, volume
- Mix of statuses

---

## Completion Checklist

- [ ] `npm install recharts framer-motion lucide-react` done
- [ ] `tailwind.config.ts` updated with full custom design system
- [ ] `app/globals.css` updated with clip-path, shimmer, utility classes
- [ ] `app/layout.tsx` updated with 3 fonts
- [ ] All `components/ui/*` built (Button, Input, Toast, FilterBar, WalletButton, LoadingShimmer, EmptyState, StatCard, Badge)
- [ ] `components/layout/Sidebar.tsx` built
- [ ] `components/layout/TopBar.tsx` built (with ticker)
- [ ] `components/layout/BottomNav.tsx` built (mobile)
- [ ] `components/kol/StatBar.tsx` built with useCountUp
- [ ] `components/kol/LeaderboardTable.tsx` built (full spec)
- [ ] `components/kol/KOLProfileCard.tsx` built (expandable)
- [ ] `components/kol/CallFeed.tsx` built
- [ ] `components/kol/Sparkline.tsx` built
- [ ] `components/deals/DealTable.tsx` built
- [ ] `components/deals/CreateDealForm.tsx` built (3-step)
- [ ] `components/deals/ApplicationTable.tsx` built
- [ ] `components/deals/ApplyModal.tsx` built
- [ ] `lib/context/AuthContext.tsx` built
- [ ] `lib/context/ToastContext.tsx` built
- [ ] `hooks/useAuth.ts` built
- [ ] `hooks/useToast.ts` built
- [ ] `hooks/useCountUp.ts` built
- [ ] `lib/mock/kols.ts` built (20 entries)
- [ ] `lib/mock/deals.ts` built (10 entries)
- [ ] `app/(marketing)/layout.tsx` built
- [ ] `app/(marketing)/page.tsx` built (landing page, all sections)
- [ ] `app/(auth)/layout.tsx` built
- [ ] `app/(auth)/login/page.tsx` built
- [ ] `app/(auth)/register/page.tsx` built (2-step with role selection)
- [ ] `app/(app)/layout.tsx` built (app shell)
- [ ] `app/(app)/dashboard/page.tsx` built (redirect)
- [ ] `app/(app)/leaderboard/page.tsx` built
- [ ] `app/(app)/deals/page.tsx` built (role-aware)
- [ ] `app/(app)/deals/create/page.tsx` built
- [ ] `app/(app)/deals/[id]/page.tsx` built
- [ ] `app/(app)/profile/page.tsx` built
- [ ] `tsc --noEmit` passes with zero errors
- [ ] `npm run dev` starts without errors

When all items are checked, output: "Frontend complete." then run:
openclaw system event --text "Frontend complete: KOLVault UI built" --mode now
