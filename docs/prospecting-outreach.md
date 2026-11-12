# AI Digital Prime — UK prospect discovery and outreach

## URLs and deployment

- /admin and /admin/outreach use the same private email-code session.
- Both run in the existing Railway service with the persistent /data volume.
- The AI draft generator uses the server-side OPENAI_API_KEY and OPENAI_MODEL already used by the website.

## Companies House discovery

- Set COMPANIES_HOUSE_API_KEY in Railway to enable search; create an API key via https://developer.company-information.service.gov.uk/ .
- Search official Companies House Advanced Search API for active LTDs registered within 7, 14 or 30 days, 100 at a time, with paging.
- Company number, name, incorporation date and registered location are imported when provided. Corporate registrations do not come with verified business email addresses.
- New prospects begin unverified, not eligible for an email send.
- No background Companies House cron runs until a key is configured and a scheduled integration is explicitly added.

## Existing Google Sheet

Paste tab-separated (copy/paste from Sheets) or comma-separated CSV rows into Import from Sheets. The Calinescu Technologies Business Leads sheet uses columns A:M: Business, Industry, Location, Phone, Website, Hours, Observation, Source, Verified date, Service opportunity, Contact permission, Lead status and Notes. Optional email column is supported.

The importer de-duplicates by company number, email, or business name + location. It intentionally does not auto-import a claim of marketing consent from a spreadsheet. Confirm it and record the specific source and evidence for each prospect.

## Prospect pipeline

Each prospect stores business details, contact info, legal form, source URL, verification date, service fit, verified observation, marketing eligibility, email draft, last-contact time and activity history.

Stages: new, researching, ready, contacted, replied, interested, meeting, not interested, suppressed.

The AI draft generator uses verified facts (never invented business pain points) and produces British English copy. Changes and drafts must be saved before sending.

- Corporate-reviewed contacts: manually open a draft in an email app; afterward click Mark manually sent to record outreach. This is NOT proof of delivery.
- Documented opted-in contacts: when permission is consented and consent evidence is saved, the owner can explicitly click Send opted-in email through Resend. The system records provider acceptance, not delivery or a reply.
- Do not contact: suppress permanently. Marketing unsubscribe emails have a confirmation page at /outreach/unsubscribe and the suppression is stored durably.
- Reply stages are updated manually; no email inbox sync is active. A meeting-stage lead is not a calendar booking; use the separate agreed-appointments record only for real appointments.

## Legal and provider restrictions

- ICO PECR B2B rules distinguish corporate subscribers from sole traders or some partnerships. Corporate B2B emails can be permitted without PECR consent in some circumstances, while UK GDPR and opt-out/identity rules still apply.
- Resend Acceptable Use Policy updated October 2026 specifically forbids unsolicited cold email and scraped lists. The application sends through Resend ONLY to documented opted-in recipients.
- No automatic cold email batches, no automated outbound phone calls, no unauthorized website scraping and no sending to unverified recipients.
- Using another outbound provider requires checking that provider's applicable terms plus UK legal obligations, contact permission and sender authentication.

## Setup checklist

1. Use /admin to request an email login code via existing Resend variables.
2. Add COMPANIES_HOUSE_API_KEY to Railway for live company searches.
3. Until configured, copy the researched rows from the existing Google Sheet into Import from Sheets.
4. Verify website/email, entity, contact permissions and genuine business observations; create a reviewed email draft and track its status.
5. An automated Google Sheets live sync, mail reply sync and daily Companies House cron would require further provider credentials/integration. They are not enabled in the current build.
