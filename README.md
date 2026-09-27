# Attendance Tracker

A personal college attendance tracker built against a 75% requirement.
React + Tailwind CSS on the frontend, Supabase (Postgres + Auth) on the backend.

## Features

- Email/password sign up & log in (no social login)
- Hard onboarding gate: `setupComplete` on the profile forces every new
  account through the setup wizard before it can reach the dashboard
- Configurable term structure (4–6 months, syllabus vs exam months)
- Weekly timetable builder with drag-and-drop reordering and "copy from
  previous day"
- Auto-generated 4-week × 5-day monthly calendars from the timetable
- Dashboard scoped to one month at a time (with a switcher to browse
  past months within the term), overall/monthly/per-subject attendance,
  a bunk calculator ("can miss N more" / "need to attend next M"), and
  alert banners
- Fast, thumb-friendly daily marking screen (Present / Absent /
  Holiday-Cancelled, autosaves on tap)
- Monthly calendar heatmap, tap a day to jump to marking
- Per-subject analytics with a month-by-month trend chart and a 75%
  threshold line
- Activity log: a plain, non-AI, timestamped record of everything that
  changed — attendance marks, timetable edits, holidays, makeup
  lectures, setup completion
- Settings: edit timetable (applies going forward only), mark holidays,
  add one-off makeup lectures, dark/light mode
- PWA manifest + icons so it installs cleanly to a phone home screen

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the contents of `supabase/schema.sql`. This
   creates all tables (`profiles`, `terms`, `timetable_slots`,
   `attendance_records`, `holidays`) with row-level security so each user
   only ever sees their own data.
3. In **Project Settings → API**, copy the **Project URL** and **anon
   public key**.
4. In **Authentication → Providers**, make sure **Email** is enabled. If
   you don't want to deal with confirmation emails while testing, you can
   turn off "Confirm email" under **Authentication → Settings**.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL — sign up, complete onboarding, and start
marking attendance.

## 4. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import it in Vercel (framework preset: **Vite**).
3. Add the two `VITE_SUPABASE_*` environment variables in the Vercel
   project settings.
4. Deploy. Add the deployed URL to Supabase's **Authentication → URL
   Configuration → Redirect URLs** if you later add magic links or OAuth.

## Project structure

```
src/
  components/     shared UI (shell, nav, timetable editor, cards)
  context/        ThemeContext (light/dark), AuthContext (Supabase session)
  hooks/          useAttendance, useTimetable, useTerm — all Supabase I/O
                  lives here, kept out of components
  pages/          one file per screen, + pages/onboarding/ for the wizard
  utils/          attendanceMath.js (percentages, bunk calculator),
                  dateHelpers.js (month/weekday generation)
supabase/
  schema.sql      run this once in the Supabase SQL editor
```

## Notes on the attendance model

- A term is `termMonths` long (4–6), split into syllabus months and exam
  months — both configurable in onboarding, not hardcoded to 5+1.
- Each month is generated as 4 weeks × Mon–Fri from the weekly timetable
  template at the time it's first viewed/marked.
- `attendance_records` rows snapshot subject/type/time when they're
  created, so editing the timetable later in Settings only changes
  future months — it never rewrites history.
- "Cancelled" (holidays, cancelled lectures) are excluded from both the
  numerator and denominator of every percentage. "Unmarked" lectures
  still count in the denominator, since an unmarked lecture is treated
  as not-yet-attended rather than as if it never happened.
- **The dashboard is scoped to a single month at a time**, with arrows to
  flip between months within the current term (bounded by the term's
  start date and length, same limit as the Calendar page). The 75%
  coloring, alert banners, subject cards, and bunk calculator on the
  dashboard are all based on whichever month is selected, judged on its
  own — not on the term-to-date total. A "Term to date" stat is still
  shown alongside it for reference, but it's informational only and
  doesn't drive alerts or coloring. Viewing a past month switches the
  per-subject bunk-calculator line to a final "finished the month at/below
  75%" readout, since there's nothing left to attend or miss in a month
  that's already over.
- To see the day-by-day record behind any month's numbers, use the
  Calendar page (tap a day to open its lecture list) or the Analytics
  page's per-subject month-by-month trend chart.

## Activity log

`activity_log` is a plain factual audit trail — not AI-generated. The
app writes one row to it every time something actually changes:
marking a lecture present/absent/cancelled, editing the timetable
(add/update/remove/reorder/copy), marking or clearing a holiday, adding
or removing a makeup lecture, and completing onboarding setup. The
Activity page (`/activity`) reads that table back, newest first,
grouped by day. It's a small, separate table with its own row-level
security, so re-running `supabase/schema.sql` (safe — every statement
is idempotent) is all that's needed to add it to an existing project.
