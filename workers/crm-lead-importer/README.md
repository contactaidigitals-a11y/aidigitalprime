# AI Digital Prime — nightly UK local business lead research

This is the independent Railway cron worker feeding Public CRM at `partners.aidigitalprime.co.uk`. No changes to the website, authentication, or sales agents.

## Delivery and daily targets

Railway schedule (UTC): `0 1,3,5,6,21,23 * * *`.

- 21:00 UTC in the evening starts researching **the next UK business day**.
- 23:00, 01:00, 03:00, 05:00 and 06:00 UTC continue that daily batch. UK time/date boundaries are calculated with `Europe/London` so summer-time transitions work.
- All work for a given day accumulates in PostgreSQL. The last 06:00 UTC run starts at 06:00 GMT / 07:00 BST. Each run is limited to 22 minutes by default, leaving a buffer before **08:00 UK**.
- Target: screen **1,000 distinct, non-duplicate business candidates** and select **the highest-scoring 150 eligible new leads per day**, not 150 per run.
- A full 1,000-company screening must happen before early publication. If fewer than 1,000 have been screened, the final 06:00 UTC run publishes the best validated subset available to avoid missing the 08:00 deadline.
- The target is best-effort, not guaranteed. Unavailable Overpass data or failed website verification can yield fewer screened candidates or fewer than 150 qualified leads. Never generate fictitious businesses, or add unverified entries.

## Verification and ranking

- Prioritizes independent small UK businesses, avoiding known brands, chains, franchise signals, and public-sector locations.
- Requires a public business phone, a reachable HTTPS website matching the business identity or listed phone, and no known closed-status signal.
- Scores valid businesses for contactability, industry, independent website identity, business email, postcode, hours, company-number availability and freshness of OSM edits.
- Includes name, sector, location, phone, website, public email, opening hours, publicly listed services, Companies House number where available, sources, and verification date.
- A reachable business website is **not proof** the premises is currently trading or the number accepts calls. These leads remain marked as likely active (not guaranteed).

## No duplicate leads

- `partner_portal.crm_lead_import_candidates` keeps a per-day log of checked OSM source IDs and results and resumes from the stored geographic cursor after interruptions.
- Before checking or inserting, the worker excludes phones, website hosts and exact normalized name/address combinations already in `partner_portal.leads`, across **all prior dates**, plus duplicated candidates in the same batch.
- The INSERT itself rechecks the CRM for duplicates and uses `ON CONFLICT DO NOTHING`.
- `partner_portal.crm_lead_import_runs` records attempted, eligible, imported and partial/complete state for each UK date.
- New rows have `status=new` and no agent assignment. Agents claim leads in Public CRM.
- Does not call or message leads. Sales staff must still perform TPS/CTPS screening and observe objections, GDPR and PECR before outreach.

Data © OpenStreetMap contributors (ODbL): https://www.openstreetmap.org/copyright

Railway environment variables: `DATABASE_URL` (secret), `DRY_RUN=0`, `LEADS_PER_DAY=150`, `REVIEW_PER_DAY=1000`, `MAX_RUN_MINUTES=22`.
