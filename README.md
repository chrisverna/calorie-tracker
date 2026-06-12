# Daily Fuel

Daily Fuel is a private, local-first calorie and macro tracker built for desktop and phone. It
tracks calories, protein, carbohydrates, fat, meals, reusable foods, recipes, history, and trends.
It also includes installable PWA support and optional secure cross-device syncing.

## Tech stack

- React 19 + TypeScript + Vite
- Vite PWA / Workbox for installation and offline app-shell caching
- Browser `localStorage` for instant, no-setup local use
- Optional Supabase Auth + Postgres for cross-device sync
- ZXing Browser for camera barcode scanning
- Open Food Facts for free nutrition lookup
- Vitest for calculation and API-mapping tests

This stack keeps the app simple to run while supporting modern desktop and mobile browsers from one
codebase. The local-first data layer means logging remains available without a network connection.
Supabase is optional, but it is the recommended shared storage because it provides managed Postgres,
magic-link authentication, and row-level security without putting a private secret in the browser.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally [http://localhost:5173](http://localhost:5173).

Other commands:

```bash
npm run build
npm run preview
npm run test
npm run lint
```

To use the dev server from a phone on the same Wi-Fi network:

```bash
npm run dev -- --host
```

Open the network URL shown by Vite on the phone. Camera access normally requires HTTPS except on
`localhost`; a deployed HTTPS version is recommended for testing barcode scanning on a phone.

## Features

- Add, edit, and delete foods by breakfast, lunch, dinner, or snacks
- Custom serving size and number of servings
- Daily calorie ring, macro progress bars, macro split donut
- Saved foods and recent-food search
- Text search across USDA FoodData Central and Open Food Facts
- Copy all foods from the previous day
- Reusable meals and recipes with per-serving nutrition
- Previous-day browsing, two-week date selector, and entry filtering
- 7, 14, and 30-day calorie and macro trend reports
- Editable daily calorie goal with protein, carbohydrate, and fat percentages totaling 100%
- Camera barcode scanning plus manual barcode entry
- Open Food Facts results are always editable before saving
- JSON export/import for portable backups
- Offline-capable PWA shell
- Optional passwordless cloud sync

Macro goals are calorie-based: protein and carbohydrates use 4 calories per gram, and fat uses
9 calories per gram. The app only saves a macro split when the three percentages total exactly
100%, then derives the corresponding gram targets from the daily calorie goal.

Nutrition-label OCR is intentionally not included. Reliable label parsing would need a separate OCR
service and a careful confirmation flow; barcode lookup is the stable first version.

## Data storage

### Default: local-first

Without any configuration, all data is stored in the current browser under
`daily-fuel-state-v1`. This is private to that browser and works offline. Use **Settings > Your
data > Export backup** to create a readable JSON backup.

### Optional: Supabase sync

For access from both computer and phone:

1. Create a free Supabase project.
2. Open its SQL editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. In Supabase Auth settings, enable email magic-link login and add your local/deployed URL to the
   allowed redirect URLs.
4. Copy `.env.example` to `.env.local`.
5. Add the project URL and public anonymous key:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

6. Restart the dev server, open **Settings > Cross-device sync**, and request a sign-in link.

The anonymous key is designed to be public and is restricted by the row-level security policies in
the schema. Never place the Supabase service-role key in this app. Each authenticated user can only
read or update the row whose `user_id` matches their auth identity.

The newest `updatedAt` timestamp wins when a device first connects. Later local edits save
immediately and are sent to Supabase after a short debounce. If the network drops, the local copy
continues working and sync resumes on a later edit after connectivity returns.

## Barcode scanning

The scanner uses the device camera through the browser and ZXing. After it reads a code, the app
requests:

```text
https://world.openfoodfacts.org/api/v2/product/{barcode}.json
```

Serving-level values are preferred; if unavailable, the app falls back to values per 100 g. Missing
products, incomplete nutrition, denied camera permission, and API failures all fall back to an
editable manual-entry flow.

Open Food Facts is community-maintained, so confirm the package label before saving.

## Food database search

The **Foods** screen supports product and food-name searches such as `banana`, `chobani yogurt`,
or `fairlife protein shake`.

1. USDA FoodData Central is queried first for general and branded foods.
2. Open Food Facts full-text product search is queried as a secondary source, especially for
   packaged products.
3. Results are normalized into the same calories, protein, carbohydrate, fat, brand, and serving
   fields.
4. Duplicate-looking products are removed when their normalized names and brands match.
5. Selecting a result opens the existing editable food form. Nothing is logged until you review
   and confirm it.

Search-added foods appear in **Foods > Recent**. The app uses the external database ID to avoid
adding the same product to the recent list endlessly.

### Get a USDA FoodData Central API key

FoodData Central requires a free data.gov API key:

1. Visit [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide.html).
2. Choose **Get an API Key** and complete the data.gov signup form.
3. Check your email for the API key.
4. In the project directory, create `.env.local` if it does not already exist:

```bash
cp .env.example .env.local
```

5. Add the key:

```dotenv
VITE_USDA_API_KEY=your-fooddata-central-api-key
```

6. Stop and restart `npm run dev`. Vite only reads environment variables when it starts.

Do not commit `.env.local`. The key is not hardcoded and remains outside source control. However,
variables beginning with `VITE_` are embedded in the browser build and can be inspected by someone
using the deployed app. That is generally acceptable for this personal app. A publicly distributed
version should call USDA through a server-side proxy if the key must be fully concealed.

The USDA default limit is currently 1,000 requests per hour per IP address. Open Food Facts basic
search does not require an API key.

### Search data limitations

- USDA search nutrient values are generally provided per 100 g. Daily Fuel scales them when USDA
  supplies a serving weight in grams. If a listed serving cannot be converted safely, the result
  remains labeled as `100 g`.
- Open Food Facts is community-maintained. Serving and nutrition fields may be missing, outdated,
  or entered incorrectly.
- When Open Food Facts provides serving-level nutrition, Daily Fuel prefers it; otherwise it uses
  values per 100 g.
- Missing calories or macros are shown with a dash in search results and become editable zero
  values in the confirmation form.
- Always compare packaged-food results with the current nutrition label before saving.
- If USDA is unavailable or its key is not configured, Open Food Facts results can still appear.
- Manual food entry and barcode scanning remain separate fallbacks. Barcode lookup continues to use
  the Open Food Facts barcode endpoint.

## Install on desktop or phone

After deploying over HTTPS, use the browser's **Install app** or **Add to Home Screen** action.
The app opens in a standalone window and caches its interface for offline use. Nutrition lookups and
cloud sync still require a network connection.

## Deployment

Build with `npm run build` and deploy the generated `dist` directory to any static host such as
Vercel, Netlify, or Cloudflare Pages. Configure the two `VITE_SUPABASE_*` variables in the host's
environment settings when cloud sync is enabled, and configure `VITE_USDA_API_KEY` to enable USDA
food search. Configure SPA fallback routing to `index.html`; the included PWA service worker also
supplies a navigation fallback.
