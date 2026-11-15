# Daily UK CRM lead importer

Runs as an isolated Railway cron service in the AI Digital Prime project.

- Collects up to 100 new UK businesses per day across salons, tattoos, mechanics, dental practices and other appointment-based sectors.
- Source: OpenStreetMap Overpass (data © OpenStreetMap contributors, licensed ODbL). Records source URLs and attribution.
- Imports directly into partner_portal.leads in the existing PostgreSQL CRM.
- New leads have status 'new' and no assigned agent. Never makes calls, sends messages or changes existing records.
- Deduplicates by public business telephone, website, and company + address; also uses existing database unique constraints.
- Only uses public business listings with a phone or website; details are explicitly marked unverified for sales staff.
- Writes import counts and outcomes to partner_portal.crm_lead_import_runs.
- 100 is a target, not a guarantee: missing data, provider outages and duplicates can reduce results. It never fabricates businesses.

Railway variables: DATABASE_URL (reference to existing Postgres service), LEADS_PER_DAY=100, DRY_RUN=0.
Recommended cron: 0 9 * * * UTC.

This branch is separate from main and does not change the live website.
