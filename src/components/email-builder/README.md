# Email campaign builder

The shared campaign wizard routes email campaigns into this lazy-loaded editor. The canonical v2 document is stored in the existing campaign JSON snapshot; no generated HTML is saved as editable source. Version 1 remains readable by the backend, and the editor upgrades it on save. Legacy remote images must be uploaded again to enter the managed asset pipeline.

## Architecture proof

GrapesJS with grapesjs-mjml 1.0.8 was evaluated. Canonical metadata survived model round-trips, but the live MJML canvas did not render reliably in the actual Next/React application. Its bundled compiler also remained on MJML 4 while the server uses MJML 5. The planned fallback was selected: React renders the canonical tree, dnd-kit handles pointer/keyboard reordering, and Tiptap edits structured text in a separate panel. There is one application-owned history; Tiptap history is disabled. GrapesJS proof dependencies were removed.

The live design canvas is approximate. Final preview, Review and delivery use backend rendering. Browser previews do not emulate Outlook or client dark-mode transforms.

## Activation

Deploy the backend migration `1792300000000-EmailBuilderAssets` before enabling uploads. Development backend schema synchronization may already create the table; reconcile migration history through the project's normal deployment process. Public email image URLs need a stable HTTPS BACKEND_URL; replacing an ngrok hostname cannot preserve links already delivered. Mount `uploads/email` on persistent storage, shared across application instances. The implementation retains references and bytes but does not provision infrastructure or backups.

Release 2 tables default off. Enable `EMAIL_TABLES_ENABLED=true` on the backend and `NEXT_PUBLIC_EMAIL_TABLES_ENABLED=true` before the frontend build. Keep backend rendering enabled for already saved/queued table documents if hiding the table authoring UI later.

Managed JPEG/PNG/GIF assets have 48-hour staging leases, retained saved/queued references, and irreversible permanent pins before any provider attempt. No editor deletion removes image bytes. No retention-release UI is included; this intentionally favors preserving inbox URLs over reclaiming retained storage.

Sending status is advisory, cached for 15 seconds per account in each backend process and limited to 12 requests/minute per owner/account in each process. The UI polls every 30 seconds only while visible. Multi-instance deployments should enforce the aggregate limit in their API gateway or replace the local counter/cache with a shared store.

## Checks

- `npx vitest run --config vitest.email.config.mjs`
- Backend: `npx vitest run src/email` and `npx tsc --noEmit`
- `npx playwright test --config playwright.email.config.js`

For an isolated development test server, set `NEXT_DIST_DIR=.next-email-e2e` and run Next on a free port, then point `PLAYWRIGHT_BASE_URL` to it. This avoids mixing production build output with the user's active development cache. Table tests additionally require `NEXT_PUBLIC_EMAIL_TABLES_ENABLED=true` on the application server and test process. The screenshot test normalizes the application font to Arial for stable baselines.

Playwright uses a synthetic application session and intercepts backend requests. It never extracts user credentials or sends/saves against a real tenant. Run against the supported application server with `PLAYWRIGHT_BASE_URL`. Generate/review baseline screenshots on the supported browser/OS with `--update-snapshots` before enforcing visual regression in CI. The suite does not send live emails or save real campaigns.

Before production release, verify received MIME and images in Gmail web/mobile, Outlook Windows/web and Apple Mail, including Arabic mixed-direction content and light/dark modes. These real-client checks cannot be replaced by browser screenshots.
