# MedAI Academy

**AI skills for healthcare professionals** — an online course platform where doctors, nurses, pharmacists, allied health professionals, hospital staff and students learn to use AI tools safely and effectively.

Visitors browse courses, create an account, pay (bank transfer / JazzCash / Easypaisa), and learn lesson by lesson. When they finish a course they download a PDF certificate that anyone can verify online.

Everything runs on **free plans**: Vercel (hosting), Supabase (database, login, file storage), Resend (email) and Vercel Analytics.

---

## Contents

1. [What's included](#1-whats-included)
2. [How the project is organised](#2-how-the-project-is-organised)
3. [Run it on your computer](#3-run-it-on-your-computer)
4. [Set up Supabase (database + login)](#4-set-up-supabase-database--login)
5. [Set up Resend (emails)](#5-set-up-resend-emails)
6. [Make yourself an admin](#6-make-yourself-an-admin)
7. [Everyday tasks: courses, lessons, blog posts](#7-everyday-tasks-courses-lessons-blog-posts)
8. [Change colours, text, prices and payment details](#8-change-colours-text-prices-and-payment-details)
9. [How payments work](#9-how-payments-work)
10. [Put the code on GitHub](#10-put-the-code-on-github)
11. [Deploy on Vercel](#11-deploy-on-vercel)
12. [Connect a custom domain](#12-connect-a-custom-domain)
13. [Images and credits](#13-images-and-credits)
14. [Security notes](#14-security-notes)
15. [Troubleshooting](#15-troubleshooting)
16. [Before-launch checklist](#16-before-launch-checklist)

---

## 1. What's included

**Public pages:** Home, Courses catalogue (search + filters), Course detail, Blog (categories and tags), About, FAQ, Contact (form + WhatsApp), Book a session (Cal.com), For Institutions (enquiry form), Privacy, Terms, Refunds, Medical Disclaimer, and a custom 404 page.

**Learners:** sign up, log in (password or emailed "magic link"), forgot password, dashboard with progress and "continue where you left off", profile settings, PDF certificates, and a public certificate check at `/verify/<id>`.

**Admin panel (`/admin`):** totals (users, enrolments, pending payments, revenue), approve or reject payments (with the receipt screenshot), manually enrol users, and view users, contact messages, institution enquiries and newsletter subscribers (with CSV export).

**SEO:** unique titles and descriptions, Open Graph and Twitter images, `sitemap.xml`, `robots.txt`, canonical URLs, breadcrumbs, and structured data (Organization, Course, Article, FAQPage, BreadcrumbList). Public pages are pre-built as static HTML, so they load fast.

**Healthcare safety:** a footer disclaimer on every page, "Patient privacy" reminders on course and lesson pages, and a "Safe use of AI in healthcare" section on the home page.

### Tech stack (in plain words)

| Tool | What it does here |
| --- | --- |
| **Next.js 16** (App Router) + **TypeScript** | The website framework |
| **Tailwind CSS 4** + **shadcn/ui-style components** + **lucide-react** icons | Styling, buttons, forms, icons |
| **MDX** | Lessons, blog posts and legal pages are Markdown files you can edit |
| **Supabase** | Login, PostgreSQL database and private file storage (payment receipts) |
| **Resend** | Sends emails (payment received, access approved, certificates, contact form) |
| **pdf-lib** | Draws the PDF certificates |
| **zod** | Checks every form, on the server |
| **Vercel Analytics** | Free visitor statistics |

---

## 2. How the project is organised

```
content/                      ← YOUR CONTENT (edit these files)
  courses/<course-slug>/
    course.json               ← title, price, modules, outcomes, audience…
    01-getting-started/       ← one folder per module
      01-welcome….mdx         ← one file per lesson (nn-lesson-slug.mdx)
    resources/                ← downloadable files (enrolled learners only)
  blog/<post-slug>.mdx        ← blog articles
  legal/*.mdx                 ← privacy, terms, refunds, medical disclaimer

src/
  config/                     ← SETTINGS (edit these files)
    site.ts                   ← brand name, tagline, contact, WhatsApp, Cal.com, instructor
    payment.ts                ← payment methods, account numbers, USD display
    faq.ts                    ← FAQ questions
    home.ts                   ← home page testimonials, trust points, safety principles
    images.ts                 ← stock photos
  app/
    globals.css               ← COLOURS AND DESIGN TOKENS
    layout.tsx                ← FONTS
    (site)/…                  ← all pages (home, courses, blog, dashboard, admin…)
    learn/[course]/[lesson]/  ← the lesson player
    api/…                     ← certificate PDFs, protected downloads, CSV export
  components/                 ← reusable building blocks (ui/, course/, forms/…)
  lib/                        ← logic: content loading, auth, payments, emails, SEO
supabase/
  migrations/                 ← SQL to set up the database (run once)
  make-admin.sql              ← makes your account an admin
public/                       ← logo, course covers and illustrations (SVG)
```

### Database tables (Supabase)

| Table | Stores |
| --- | --- |
| `profiles` | One row per user: name, email, profession, organisation, role (`user`/`admin`) |
| `enrollments` | Who has access to which course (`pending`, `active`, `rejected`) |
| `payments` | Each payment submission: method, amount, transaction ID, receipt file, review status |
| `lesson_progress` | Completed lessons |
| `course_activity` | Last lesson opened (for "continue where you left off") |
| `certificates` | Issued certificates with a unique verification ID |
| `contact_messages`, `newsletter_subscribers`, `institution_enquiries` | Public form submissions |

Courses themselves are **not** stored in the database: they live in `content/courses/` and are identified by their folder name (the "slug").

---

## 3. Run it on your computer

You need **Node.js 20 or newer** ([download the LTS version](https://nodejs.org)).

```bash
# 1. Install the project's packages (only needed once)
npm install

# 2. Create your settings file
cp .env.example .env.local        # Windows (Command Prompt): copy .env.example .env.local

# 3. Start the development server
npm run dev
```

Open <http://localhost:3000>. The public pages work straight away. Logging in, payments and forms start working once you complete steps 4 and 5 and fill in `.env.local`. **Restart `npm run dev` after editing `.env.local`.**

Other useful commands:

```bash
npm run build   # build the production version (run this before pushing, to catch errors)
npm run lint    # check the code for problems
npm start       # run the production build locally
```

---

## 4. Set up Supabase (database + login)

1. Create a free account at <https://supabase.com> and click **New project**.
   - Choose a strong database password and save it somewhere safe.
   - **Region:** pick the one closest to your learners (for Pakistan, *Mumbai* or *Singapore*).
2. When the project is ready, open **Project Settings → API Keys** (or **API**) and copy into `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (or legacy **anon** key) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Secret key** (or legacy **service_role** key) → `SUPABASE_SECRET_KEY` ⚠️ keep this secret
3. **Create the tables.** Open **SQL Editor → New query**, paste the whole contents of each file below, and click **Run** — one at a time, in this order:
   1. `supabase/migrations/0001_schema.sql` (tables)
   2. `supabase/migrations/0002_security.sql` (Row Level Security: who can see what)
   3. `supabase/migrations/0003_storage.sql` (private storage for payment receipts)

   You should see "Success. No rows returned" each time. The files are safe to run again.
4. **Tell Supabase your website address.** Go to **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` for now (change it to your live address after deploying).
   - **Redirect URLs:** add `http://localhost:3000/**` and later `https://your-live-address/**`.
5. **Emails from Supabase (recommended).** Supabase's built-in email service only sends a few emails per hour, which is fine for testing but not for launch. Connect Resend as the email sender: **Authentication → Emails → SMTP Settings → Enable custom SMTP** and enter:
   - Host `smtp.resend.com`, Port `465`, Username `resend`, Password = your Resend API key
   - Sender email: an address on the domain you verified in Resend (see step 5).
6. *(Optional)* **Email templates:** under **Authentication → Emails → Templates** you can reword the sign-up, magic link and reset-password emails. The default links work with this site as they are.

> **Email confirmation:** by default, new users must click a link in their email before they can log in. You can switch this off under **Authentication → Sign In / Providers → Email → Confirm email**, but leaving it on is safer.

---

## 5. Set up Resend (emails)

The website sends emails when someone submits a payment, when you approve or reject it, when a certificate is issued, and when the contact or institution forms are used.

1. Create a free account at <https://resend.com>.
2. **API Keys → Create API Key** → copy it into `RESEND_API_KEY` in `.env.local`.
3. Set `ADMIN_EMAIL` to your own email address (you receive the notifications).
4. **For testing**, keep `EMAIL_FROM=MedAI Academy <onboarding@resend.dev>`. Resend then only delivers to the email address you signed up to Resend with.
5. **Before launch**, verify your own domain: **Domains → Add Domain**, add the DNS records Resend shows you at your domain provider, wait until it says *Verified*, then set `EMAIL_FROM=MedAI Academy <hello@yourdomain.com>`.

If `RESEND_API_KEY` is empty, nothing breaks: emails are simply printed in the terminal.

---

## 6. Make yourself an admin

1. Start the site and **sign up** with your own email address (and confirm it).
2. Open `supabase/make-admin.sql`, replace `you@example.com` with your email.
3. Paste it into **Supabase → SQL Editor** and click **Run**. The result should show your email with `role = admin`.
4. Log out and log in again. You now see **Admin panel** in your dashboard menu, or go to `/admin`.

(For safety, the website itself can never change anyone's role — only you, from the Supabase SQL Editor.)

---

## 7. Everyday tasks: courses, lessons, blog posts

All content lives in the `content/` folder as plain text files. After changing them, run `npm run dev` to preview, then push to GitHub — Vercel rebuilds the site automatically.

### Add a lesson

Create a file in the right module folder, named `<number>-<lesson-slug>.mdx`, e.g.
`content/courses/designing-with-claude/02-writing-effective-prompts/08-my-new-lesson.mdx`:

```mdx
---
title: "My new lesson"
order: 8            # position in the course (sorts lessons)
duration: 15        # minutes
freePreview: false  # true = anyone can read it without paying
description: "One sentence shown in previews."
# Optional:
# video: "https://www.youtube-nocookie.com/embed/VIDEO_ID"
# resources:
#   - title: "Checklist (printable)"
#     file: "my-checklist.pdf"     # put the file in the course's resources/ folder
---

Write your lesson in **Markdown** here. Headings start with ##, lists with -.

<Callout type="tip" title="A helpful tip">

Text inside a callout. Types: tip, note, warning, privacy.

</Callout>

<Prompt title="Try this">

An example prompt learners can copy with one click.

</Prompt>

<Exercise title="Practise">

Instructions for a short exercise.

</Exercise>

<KeyTakeaways>

- Point one
- Point two

</KeyTakeaways>

![Describe the image here (this is also its caption)](/images/courses/my-diagram.svg)
```

Rules:
- The part of the file name after the number becomes the lesson's web address (`/learn/<course>/my-new-lesson`), so it must be unique within the course.
- Leave an **empty line** after an opening tag like `<Callout …>` and before its closing tag.
- Do not use curly braces `{ }` or a bare `<` in lesson text (MDX treats them as code). Write "less than" instead.
- Images go in `public/images/…` and are referenced as `/images/…`.

### Add a module

Create a new folder inside the course (e.g. `05-advanced-topics/`) and add it to `modules` in `course.json`:

```json
{ "folder": "05-advanced-topics", "title": "Advanced topics", "description": "One line about the module." }
```

### Add a new course

1. Copy an existing course folder, e.g. `content/courses/ai-clinical-documentation/`, and rename it. **The folder name is the course's address** (`/courses/<folder-name>`) — use lowercase words joined by hyphens, and don't change it after people have enrolled.
2. Edit `course.json`:
   - `title`, `subtitle`, `description`, `tool` (e.g. "Claude"), `level` (`Beginner` / `Intermediate` / `Advanced`), `duration` (e.g. `"4 hours"`)
   - `price`: `{ "pkr": 4999 }` — optionally `"usd": 18` to show a fixed USD price (otherwise it is calculated). Use `0` for a free course.
   - `published`: `false` shows the course with a **Coming soon** badge; set to `true` when lessons are ready.
   - `roles`: any of `doctors`, `nurses`, `pharmacists`, `allied-health`, `admin`, `students` (used by the catalogue filter)
   - `audience`, `outcomes`, `prerequisites`, `faqs`, `keywords`
   - `image`: a cover image in `public/images/courses/` (1200×675 works best)
3. Add module folders and lessons as described above.

The site checks `course.json` and lesson headers when building. A typo produces a clear error message telling you which file to fix.

### Add a blog post

Create `content/blog/<post-slug>.mdx`:

```mdx
---
title: "Your article title"
description: "One or two sentences for search results and social media."
date: "2026-11-01"
author: "Your Name"
category: "Practical guides"
tags: ["Prompting", "Nurses"]
image: "/images/blog/prompting-basics.svg"   # optional
# draft: true                                 # hides the post
---

Your article in Markdown…
```

Categories and tags get their own pages and are added to the sitemap automatically.

### Edit legal pages and FAQs

- Legal pages: `content/legal/*.mdx` (Markdown).
- FAQs: `src/config/faq.ts`. Questions marked `featured: true` also appear on the home page.

---

## 8. Change colours, text, prices and payment details

| To change… | Edit |
| --- | --- |
| Brand name, tagline, description, contact email, WhatsApp number, Cal.com link, instructor bio | `src/config/site.ts` |
| Payment methods, bank / JazzCash / Easypaisa details, USD exchange rate, max receipt size | `src/config/payment.ts` |
| Course prices | `price` in each `content/courses/<slug>/course.json` |
| Colours (navy, teal, greys, success green…) | the `:root` section at the top of `src/app/globals.css` |
| Fonts | `src/app/layout.tsx` (any [Google Font](https://fonts.google.com) works with `next/font/google`) |
| Home page testimonials, trust points, safety principles | `src/config/home.ts` |
| Navigation and footer links | `mainNav` and `footerNav` in `src/config/site.ts` |
| Logo | `src/components/brand/logo.tsx`, `src/app/icon.svg`, `public/logo.svg` |
| Email wording | `src/lib/email/templates.ts` |
| Certificate design | `src/lib/certificate-pdf.ts` |

If you change colours, keep enough contrast for readability (check with <https://webaim.org/resources/contrastchecker/>; aim for at least 4.5:1 for text).

---

## 9. How payments work

**Phase 1 (built): manual payments**

1. A learner clicks **Enroll now** (they must be logged in).
2. They see your payment details (from `src/config/payment.ts`), pay by bank transfer, JazzCash or Easypaisa, then upload a receipt screenshot and the transaction ID.
3. Their enrolment becomes **Pending**. You get an email, and the learner gets a "we received your payment" email.
4. In **Admin → Enrolments & payments** you open the receipt, check it against your bank or wallet app, and click **Approve** (or **Reject** with a reason).
5. On approval the learner gets access immediately and receives a confirmation email. If you reject a payment, the learner can submit corrected details.

You can also **enrol someone manually** (for example an institution that paid by invoice) from the same admin page.

**Later: online payments.** The code uses a *payment provider interface* (`src/lib/payments/types.ts`). To add a card or wallet gateway, follow the step-by-step comments in `src/lib/payments/online-gateway.example.ts`. You won't need to change the database, dashboard or admin panel.

---

## 10. Put the code on GitHub

1. Create a free account at <https://github.com> and click **New repository** (choose **Private** if you prefer). Don't add a README — this project already has one.
2. In a terminal inside the project folder:

```bash
git add .
git commit -m "My MedAI Academy site"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

`.env.local` is listed in `.gitignore`, so your secret keys are **not** uploaded. Never paste keys into code files.

---

## 11. Deploy on Vercel

1. Sign up at <https://vercel.com> with your GitHub account (the **Hobby** plan is free).
2. Click **Add New → Project**, choose your repository, then click **Import**. Vercel detects Next.js automatically.
3. Before clicking **Deploy**, open **Environment Variables** and add every variable from your `.env.local`:
   - `NEXT_PUBLIC_SITE_URL` → your Vercel address, e.g. `https://medai-academy.vercel.app` (update it later if you add a custom domain)
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
   - `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`, `NEXT_PUBLIC_CAL_LINK`
4. Click **Deploy**. After a minute or two your site is live.
5. **Update Supabase** (Authentication → URL Configuration): set **Site URL** to your live address, and add `https://your-live-address/**` to **Redirect URLs**.
6. **Turn on analytics:** in your Vercel project, open **Analytics** and click **Enable**.
7. From now on, every `git push` to `main` redeploys the site automatically.

> After changing environment variables in Vercel, go to **Deployments → ⋯ → Redeploy** for them to take effect.

---

## 12. Connect a custom domain

1. Buy a domain from any registrar (e.g. Namecheap, Cloudflare, GoDaddy, or a `.pk` registrar).
2. In Vercel: **Project → Settings → Domains → Add**, type your domain and follow the instructions (usually an `A` record and a `CNAME` record at your registrar).
3. When Vercel shows it as valid (HTTPS is added automatically):
   - change `NEXT_PUBLIC_SITE_URL` in Vercel to `https://www.yourdomain.com` and redeploy;
   - update **Site URL** and **Redirect URLs** in Supabase;
   - verify the domain in Resend and update `EMAIL_FROM`.
4. Submit `https://www.yourdomain.com/sitemap.xml` in [Google Search Console](https://search.google.com/search-console) to help Google find your pages.

---

## 13. Images and credits

All illustrations, icons, course covers, the logo and the certificate design are **original SVG artwork made for this project** — free to use and edit (`public/images/`, `src/components/illustrations/`, `src/components/brand/`). No third-party logos are used.

Two pages use free-licence stock photos from **Unsplash** ([Unsplash License](https://unsplash.com/license) — free for commercial use, attribution appreciated but not required). They are listed in `src/config/images.ts`:

| Where | Photo | Source |
| --- | --- | --- |
| About page | Clinician using a tablet | <https://unsplash.com/photos/photo-1576091160399-112ba8d25d1d> (image URL: `images.unsplash.com/photo-1576091160399-112ba8d25d1d`) |
| For Institutions page | Healthcare professionals in a hospital | <https://unsplash.com/photos/photo-1551076805-e1869033e561> (image URL: `images.unsplash.com/photo-1551076805-e1869033e561`) |

⚠️ These photos could not be previewed when this project was built, so **open each link and check you like the photo** before launch. If a photo ever fails to load, the site automatically shows an on-brand illustrated panel instead. To swap a photo: open it on unsplash.com, right-click the image → *Copy image address*, and paste it into `src/config/images.ts`.

---

## 14. Security notes

- **Row Level Security** is enabled on every table: learners can only read their own data, and admins can read everything. Learners cannot give themselves access, approve payments, change their role or create certificates. These rules are enforced by the database itself.
- **Lessons are protected on the server.** Paid lesson content is only read from disk and sent to the browser after the server confirms an active enrolment. Downloadable resources are served through a checked route.
- **Payment receipts** are stored in a private bucket. Admins see them through temporary links that expire after one hour.
- **Forms** are validated with zod on the server and include a hidden "honeypot" field to stop simple spam bots.
- **Secrets** live only in environment variables. Only `NEXT_PUBLIC_…` values reach the browser, and those are safe to expose.
- Remind learners (and yourself) to **never** upload patient information anywhere on the site.

---

## 15. Troubleshooting

| Problem | Fix |
| --- | --- |
| "Accounts are not set up yet" when signing up | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are missing. Add them and restart `npm run dev` (or redeploy on Vercel). |
| "This form is not connected yet" | `SUPABASE_SECRET_KEY` is missing. |
| Confirmation / magic-link email never arrives | Check spam. Supabase's built-in email is rate-limited — set up custom SMTP with Resend (section 4, step 5). |
| Email link says "invalid or expired" | Open the link in the same browser you used to request it, and check the **Redirect URLs** in Supabase include your site address followed by `/**`. |
| I can't see the admin panel | Run `supabase/make-admin.sql` with your email, then log out and back in. |
| Receipt upload fails | The file must be JPG, PNG, WEBP or PDF and under 4 MB. Make sure `0003_storage.sql` was run. |
| Build error mentioning `course.json` or frontmatter | The message names the file and field — usually a missing comma, a missing quote, or a wrong `level`/`roles` value. |
| Certificate shows a name without some characters | The PDF uses standard fonts, which only print Latin (English-alphabet) characters; other characters are left out. Ask learners to enter their name in English letters, or embed a Unicode font in `src/lib/certificate-pdf.ts`. |

---

## 16. Before-launch checklist

**Text and branding**
- [ ] Brand name, tagline, description and contact email — `src/config/site.ts`
- [ ] WhatsApp number (`whatsappNumber`) and Cal.com link (`calLink`)
- [ ] Instructor name, title, bio and credentials (shown on the About and course pages)
- [ ] Replace the placeholder testimonials in `src/config/home.ts` with real ones (with written permission), or remove the section
- [ ] Review the FAQ answers (especially CPD/CME accreditation) — `src/config/faq.ts`
- [ ] Logo (if you want your own design)

**Courses**
- [ ] Review and edit all 13 lessons of the first course — they are realistic drafts, so check every statement
- [ ] Confirm prices in each `course.json` (and the optional `usd`); update `pkrPerUsd` in `src/config/payment.ts`
- [ ] Decide the "Expected launch" dates for the coming-soon courses

**Payments**
- [ ] Real bank account, IBAN, JazzCash and Easypaisa details — `src/config/payment.ts`
- [ ] Test a full payment yourself: enrol → upload → approve in admin → receive email → access the course

**Legal (have a qualified lawyer review)**
- [ ] Privacy Policy, Terms of Service, Refund Policy, Medical Disclaimer — `content/legal/` (remove the "REVIEW BEFORE LAUNCH" boxes when done)
- [ ] Confirm the governing law/jurisdiction in the Terms

**Photos**
- [ ] Check (or replace) the two Unsplash photos in `src/config/images.ts`

**Accounts and settings**
- [ ] Supabase project created, all 3 SQL files run, your account made admin
- [ ] Supabase Site URL + Redirect URLs set to your live address; custom SMTP (Resend) enabled
- [ ] Resend domain verified; `EMAIL_FROM` and `ADMIN_EMAIL` set
- [ ] All environment variables added in Vercel; `NEXT_PUBLIC_SITE_URL` set to your live address
- [ ] Vercel Analytics enabled
- [ ] Custom domain connected (optional) and sitemap submitted to Google Search Console
- [ ] Test sign-up, magic link, password reset, contact form, institution form and newsletter on the live site
