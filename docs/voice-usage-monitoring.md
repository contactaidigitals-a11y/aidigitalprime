# Voice usage monitoring (AI Digital Prime)

The reusable Starter/Growth/Pro Stripe Live Payment Links are saved in the **AI Digital Prime** Stripe account, NOT on the website. They each contain a recurring subscription price plus the one-time £99 setup price. Checkout asks for a required Business / company name.

## Usage ingestion

1. Mount a **persistent Railway volume** on /data (single replica only), or replace the file-based usage store with a transactional database before scaling to multiple replicas.
2. Configure an ElevenLabs **post_call_transcription** webhook pointing to https://aidigitalprime.co.uk/api/webhooks/elevenlabs.
3. Save the ElevenLabs signing secret to Railway as ELEVENLABS_POST_CALL_WEBHOOK_SECRET. Do not put it in GitHub or browser JS.
4. Set a long random AIDP_USAGE_ADMIN_TOKEN in Railway, then query GET /api/internal/usage?month=YYYY-MM with Authorization: Bearer <token>. No public-facing endpoint exposes usage.
5. The webhook authenticates HMAC, validates timestamp, deduplicates conversation IDs, stores only agent ID, conversation ID, call timing and rounded minutes. Full transcripts, audio and caller details are **not stored**. The example reporting route is read-only.

## Billing remains OFF by design

No Stripe usage invoices or automatic charges are created by these routes. A safe next step must:
- Handle Stripe checkout.session.completed, invoice.paid and subscription updates via Stripe-signed webhooks. Confirm the Business / company name and map the *Stripe customer ID* plus subscription ID to the assigned ElevenLabs agent ID.
- Reconcile on the actual Stripe subscription billing period, not a naive UTC calendar month.
- Exclude free website demonstrations and outbound sales calls from customer billing.
- Decide rounding policy and handle partial months, refunds, canceled calls and transfers; obtain client agreement.
- Compute chargeable excess = max(0, sum(ceil(each_call_seconds / 60)) - included_minutes) and apply approved caps.
- Send idempotent invoices/usage events from a durable job with Stripe API credentials stored only in Railway.
- Test with sandbox first and implement usage dashboards and customer alerts.
- Reconcile with ElevenLabs usage reports before every invoice.

WARNING: This is a metering foundation, **not active automatic usage-based billing**.
