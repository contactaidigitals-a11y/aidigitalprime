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

## Change the brand

Edit `app/config.ts`. The brand name, contact address and key links are kept there so the site can be renamed without searching through every page.

## Connect the lead form

Copy `.env.example` to `.env.local` and add:

- `NEXT_PUBLIC_SITE_URL`: the final public URL
- `RESEND_API_KEY`: API key for email delivery
- `LEAD_TO_EMAIL`: the inbox that receives leads
- `LEAD_FROM_EMAIL`: a sender address on a verified domain

Until email delivery is configured, the form gives visitors the direct contact email instead of silently losing a lead.

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
