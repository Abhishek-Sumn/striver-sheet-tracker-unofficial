# Unofficial Striver Sheet Tracker (A2Z & SDE)

> **Unofficial tracker. The sheet, its order and problem selection are the work of Striver / takeUforward — visit [takeuforward.org](https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet).**

An unofficial, free, local-first progress tracker for Striver's A2Z and SDE DSA sheets with direct LeetCode practice links. **Not affiliated with takeUforward.**

This is a non-commercial, community fan tool designed to help students track their Data Structures & Algorithms preparation offline with high-density UI, zero tracking, and complete privacy.

---

## ⚖️ Attribution & Disclaimer

- **Attribution**: The problem curriculum, pedagogical ordering, and sheet categorization are authored and curated by **Striver / takeUforward**. Please support their work at [takeuforward.org](https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet).
- **Data Source**: Problem list and ordering from Striver's sheets on [takeuforward.org](https://takeuforward.org).
- **Practice Problems**: All problem statements and coding environments belong to their respective platforms ([LeetCode](https://leetcode.com), [GeeksforGeeks](https://geeksforgeeks.org)).
- **Video Solutions**: Videos embedded in the app belong to their respective YouTube creators. They are played strictly via official YouTube nocookie embeds and never re-hosted or downloaded.
- **Non-Commercial**: This project contains no ads, no affiliate links, no paywalls, and collects zero user data.
- **Takedown / Correction Requests**: Contact `TAKEDOWN_EMAIL` — handled within 24 hours. (Configured in `src/lib/site.ts`).

---

## ✨ Features

- **Dual Sheet Switcher**: Instant switching between the 455-problem A2Z Sheet and the 191-problem SDE Sheet (646 problems total).
- **Local-First Privacy**: 100% of your progress, notes, streak, and bookmarks are stored in your browser's `localStorage`. No accounts, no servers, no tracking.
- **In-App Markdown Notes**: Write notes, intuition, and edge cases with syntax highlighting and auto-save.
- **Embedded Video Player**: Watch official YouTube video solutions directly in an embedded modal player.
- **Multi-Faceted Search & Filters**: Filter by difficulty, platform, solved/unsolved status, revision bookmarks, or notes.
- **Warmup Randomizer**: Pick a random unsolved problem to warm up.
- **1-Click Backup & Restore**: Export your progress as JSON and restore it on any device.
- **Dual Themes**: Switch between high-contrast Orange & Black and Minimalist Dark Zinc themes.

---

## 🚀 Quickstart & Local Development

### Prerequisites
- [Node.js](https://nodejs.org) `>= 18.x` (Tested on Node.js 22 & 24)
- npm

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd StriverSheet
npm install
```

### 2. Configure Contact Email
Open `src/lib/site.ts` and set your email for takedown or correction requests:
```ts
export const TAKEDOWN_EMAIL = "your-email@example.com";
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
npm test
```

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 🌐 Deploying to Vercel

This Next.js 15 App Router project is configured for 1-click deployment on [Vercel](https://vercel.com):

1. Push this repository to your GitHub account.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Leave all build settings at default (Framework Preset: **Next.js**, Build Command: `next build`, Output Directory: `.next`).
5. Click **Deploy**.
6. Your tracker will be live on your free `*.vercel.app` domain within minutes!

---

## 📄 License

- The **source code** in this repository is licensed under the [MIT License](LICENSE).
- **Sheet Content Notice**: The sheet structure, topic organization, and problem curation are © Striver / takeUforward and are **NOT** covered by the MIT license.
