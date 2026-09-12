# AI Digital Prime

Premium multi-page website for a UK AI and digital services agency.

## Local preview

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
```

## Production

The existing GitHub repository is connected to the `aidigitalprime` Railway service. Preserve that deployment; this checkout is not a registered ChatGPT Site. Configure the email variables in Railway before enabling lead delivery. The public website is `https://aidigitalprime.co.uk`.

The homepage, service directory, audit page and metadata target Harlow and nearby areas across multiple local-business sectors. The favicon is the navy/white AI monogram at `public/favicon.svg`; its metadata URL is versioned to refresh browser caches.

## Change the brand

Edit `app/config.ts`. The brand name, contact address and key links are kept there so the site can be renamed without searching through every page.

## Connect the lead form

Copy `.env.example` to `.env.local` and add:

- `NEXT_PUBLIC_SITE_URL`: the final public URL
- `RESEND_API_KEY`: API key for email delivery
- `LEAD_TO_EMAIL`: the inbox that receives leads
- `LEAD_FROM_EMAIL`: a sender address on a verified domain

The recipient defaults to `andrei@aidigitalprime.co.uk`, held in `app/config.ts`. Keep the API key and sending address server-side; never prefix them with `NEXT_PUBLIC_`.

The form sends the contact name, business name, phone number, source page and submission time through Resend. The visitor sees success only when the delivery API accepts the request. A verified sending domain and a working API key are still required; access to the Zoho inbox alone does not connect website delivery.

For a separate sending domain such as `notify.aidigitalprime.co.uk`, follow the exact DNS values shown by Resend. Keep Zoho's root-domain MX records intact. Set `LEAD_FROM_EMAIL` to an address on that verified sending domain. Restart the local server after changing `.env.local`; configure the same server-side values in the eventual hosting environment.

Until delivery is configured, submission returns an explicit error without clearing the visitor's entries. A separate WhatsApp button and direct email link remain available. No real email has been verified solely by a mocked API test.

## WhatsApp

The dedicated WhatsApp links use `+447443757519`, configured in `app/config.ts`. The floating button is available site-wide; the same option appears separately below the lead form and in the footer. It opens WhatsApp with a generic message draft. It does not auto-send anything or transfer form fields.

## Main pages

- `/`
- `/services`
- `/services/web-design`
- `/services/booking-systems`
- `/services/ai-automation`
- `/services/digital-growth`
- `/free-audit`
- `/privacy`
- `/terms`
