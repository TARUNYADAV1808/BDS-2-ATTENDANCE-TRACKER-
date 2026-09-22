# BDS II Batch B Attendance Tracker — V3

This version is a complete GitHub Pages + Supabase web app for the supplied DPU BDS II Summer Batch timetable.

## V3 features

- Batch B timetable with DMS practicals and interactive sessions included.
- Daily Present / Absent controls.
- Instant Supabase saving.
- Overall attendance:
  - primary equal-weight subject average
  - hour-weighted secondary figure
- Subject-wise attendance.
- Theory / Practical / Interactive summaries.
- 86% target.
- "How many hours can I miss?" calculator.
- "How many classes/hours must I attend?" calculator.
- Projection to final exams assuming all remaining scheduled classes are attended.
- Sessional-wise attendance.
- Monthly attendance calendar.
- Attendance history and corrections.
- Excel, CSV, PDF and JSON backup export.
- JSON restore.
- Dark mode.
- Installable PWA.
- Browser reminder for unmarked classes (best-effort; see limitation below).
- Editable sessional boundaries.
- Editable no-class/holiday dates.
- Complete timetable visible in Settings.

## Batch B timetable included

Monday:
- 08:00–09:00 Pre Clinical Prostho Theory
- 09:00–10:00 Orthodontics Practical
- 10:00–12:00 General Pharmacology Practical
- 12:30–13:00 General Pathology Theory
- 13:30–14:00 General Pathology Interactive Session
- 14:00–15:00 Pharmacology Theory

Tuesday:
- 08:00–09:00 DMS Prostho Lecture
- 09:00–10:00 DMS Conservative Lecture
- 10:00–12:00 Preclinical Prostho Practical
- 12:30–13:00 General Pathology Theory
- 13:30–14:00 Pharmacology Interactive Session
- 14:00–15:00 Pharmacology Theory

Wednesday:
- 08:00–09:00 Orthodontics Practical
- 09:00–10:00 General Microbiology Theory
- 10:00–12:00 General Pathology Practical
- 13:30–14:30 Pre Clinical Conservative Practical
- 14:30–15:00 Prostho & Conservative Interactive Session

Thursday:
- 08:00–09:00 Pre Clinical Conservative Theory
- 09:00–10:00 General Microbiology Theory
- 10:00–12:00 General Microbiology Practical
- 13:30–15:00 DMS Prosthodontics Practical

Friday:
- 08:00–09:00 Behavioural Science Lecture
- 09:00–11:00 Preclinical Prostho Practical
- 11:00–12:00 Pharmacology Theory
- 13:30–15:00 DMS Conservative Practical

Saturday:
- 08:00–10:00 Pre Clinical Conservative Practical
- 10:00–11:00 Oral Pathology Theory
- 11:00–13:00 Oral Pathology Practical

Batch-A-only blocks are not included.

## Calculation model

A timetable block is one checkbox but is weighted by duration:
- 1-hour lecture = 1.0 attendance hour
- 2-hour practical = 2.0 attendance hours
- 30-minute interactive = 0.5 attendance hours

The primary overall figure is the average of subject percentages, so one subject does not dominate simply because it has more scheduled hours. The hour-weighted figure is shown separately.

Unmarked classes are NOT treated as absences. Once marked Absent, they count against attendance.

## Academic calendar defaults

Sessional boundaries are based on the supplied academic calendar:
- Teaching → Sessional 1: 22 Sep 2026 – 20 Dec 2026
- Sessional 1 → Sessional 2: 3 Jan 2027 – 4 Apr 2027
- Sessional 2 → Sessional 3: 21 Apr 2027 – 18 Jul 2027
- Sessional 3 → University Final: 2 Aug 2027 – 22 Aug 2027

The app lets you edit these.

## Supabase setup

1. Create a Supabase project.
2. Supabase → SQL Editor → run `supabase.sql`.
3. Enable Email authentication.
4. Copy `config.example.js` to `config.js`.
5. Put the Project URL and browser-safe publishable/anon key into `config.js`.
6. Never put a `service_role` key in the browser.

## GitHub Pages

Upload:
- index.html
- style.css
- app.js
- config.js
- manifest.webmanifest
- sw.js
- icon.svg
- supabase.sql
- README.md

Then:
GitHub → repository → Settings → Pages → Deploy from branch → main → / (root).

In Supabase Authentication → URL Configuration:
- Site URL = your GitHub Pages URL
- Redirect URL = your GitHub Pages URL

## Reminder limitation

A static GitHub Pages site cannot guarantee a scheduled background notification while the browser is fully closed. The built-in reminder works while the app is open/active and permission has been granted. Installing the PWA improves the experience, but a guaranteed background push system would require a push service/Edge Function.

## Security

The Supabase tables use Row Level Security. Each logged-in user can only read/write their own attendance rows and profile settings.
