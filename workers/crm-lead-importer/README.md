# AI Digital Prime — overnight UK CRM sourcing

This is the separate worker for `partners.aidigitalprime.co.uk` / Public CRM. It does not modify the website or agent login system.

## UK delivery window

Railway cron (UTC): `0 0,2,4,6 * * *`. Runs at 00:00, 02:00, 04:00 and 06:00 UTC. The final run therefore starts at 06:00 GMT (winter) / 07:00 BST (summer), leaving a buffer before 09:00 England time.

The worker uses `Europe/London` for daily batch identity and caps each run to ~70 minutes. All runs aim for a **combined daily target** of 100 NEW leads, never 100 per run. It locks the batch and counts inserted rows from PostgreSQL so retries cannot create duplicates.

## Data quality

- Searches real UK business listings from OpenStreetMap (Overpass), rotating regions and sectors.
- Requires a public business phone **and** website.
- Rejects closed/disused records, checks HTTPS site is reachable, and requires website/company identity or phone match.
- Fetches one small public homepage with safe DNS checks and timeouts.
- Captures available business name, phone, website, address, trade, opening hours, public business email, products/services, company number if recorded, and source links.
- Stores the date and method of verification, OSM record date, and original sources in notes.
- Saves records with `status=new`, `agent_id=NULL`; never updates or assigns existing leads.
- No outbound calls, messages, emails, or assumptions of marketing consent. Agents must still check TPS/CTPS, objections, GDPR/PECR, and telephone accuracy before contacting leads.
- A responding company website does **not** conclusively prove the physical premises is trading. Records are labelled `likely active`, not guaranteed active.

The worker logs count / progress in `partner_portal.crm_lead_import_runs`. Provider failures, incomplete source coverage, TPS/CTPS screening not integrated, and inaccessible websites can result in fewer than 100 leads. No fabricated rows or placeholder contact details are inserted.

Data © OpenStreetMap contributors (ODbL): https://www.openstreetmap.org/copyright

Railway env: `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `DRY_RUN=0`, `LEADS_PER_DAY=100`.
