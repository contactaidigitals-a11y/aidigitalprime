"use client";

import { FormEvent, useEffect, useState } from "react";
import { siteConfig } from "../config";

type FormStatus = "idle" | "sending" | "success" | "error";

export function AuditForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [requestType, setRequestType] = useState("audit");
  const [message, setMessage] = useState("");
  const [serviceContext, setServiceContext] = useState("");
  const [sectorContext, setSectorContext] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const contextTimer = window.setTimeout(() => {
      if (query.get("intent") === "call") setRequestType("call");
      setServiceContext((query.get("service") || "").slice(0, 80));
      setSectorContext((query.get("sector") || "").slice(0, 80));
    }, 0);

    return () => window.clearTimeout(contextTimer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "We couldn’t send your request.");
      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="form-success" role="status">
        <span aria-hidden="true">✓</span>
        <p>Request received</p>
        <h2>Thank you. We’ll take it from here.</h2>
        <p>We’ll review your details and contact you with the next step.</p>
        <button type="button" onClick={() => setStatus("idle")}>Send another request</button>
      </div>
    );
  }

  return (
    <form className="audit-form" onSubmit={handleSubmit}>
      <input type="hidden" name="serviceContext" value={serviceContext} />
      <input type="hidden" name="sectorContext" value={sectorContext} />
      <fieldset className="intent-choice">
        <legend>I’d like to</legend>
        <label><input type="radio" name="requestType" value="audit" checked={requestType === "audit"} onChange={() => setRequestType("audit")} /><span><b>Get a free digital audit</b><small>Show me what to improve first</small></span></label>
        <label><input type="radio" name="requestType" value="call" checked={requestType === "call"} onChange={() => setRequestType("call")} /><span><b>Book a discovery call</b><small>Talk through a specific opportunity</small></span></label>
      </fieldset>

      <div className="field-grid">
        <label><span>Name *</span><input name="name" autoComplete="name" required placeholder="Your name" /></label>
        <label><span>Work email *</span><input name="email" type="email" autoComplete="email" required placeholder="you@business.co.uk" /></label>
        <label><span>Phone <small>Optional</small></span><input name="phone" type="tel" autoComplete="tel" placeholder="+44" /></label>
        <label><span>Business name *</span><input name="businessName" autoComplete="organization" required placeholder="Your business" /></label>
        <label><span>Website</span><input name="websiteUrl" type="url" inputMode="url" placeholder="https://" /></label>
        <label><span>Business type *</span><select name="businessType" required defaultValue=""><option value="" disabled>Select one</option><option>Restaurant</option><option>Takeaway</option><option>Barber shop</option><option>Hair or beauty salon</option><option>Clinic or practice</option><option>Other service business</option></select></label>
      </div>

      <label className="full-field"><span>What would you most like to improve? *</span><select name="challenge" required defaultValue=""><option value="" disabled>Select the closest fit</option><option>Restaurant ordering or automation</option><option>Online booking system</option><option>Website design or rebuild</option><option>NFC review cards</option><option>AI or admin automation</option><option>Local visibility and growth</option><option>Not sure yet</option></select></label>
      <label className="full-field"><span>Tell us a little more</span><textarea name="details" rows={5} placeholder="What feels difficult today, and what would a better result look like?" /></label>
      <label className="honeypot" aria-hidden="true">Leave this field empty<input name="companyFax" tabIndex={-1} autoComplete="off" /></label>
      <label className="consent"><input type="checkbox" name="consent" value="yes" required /><span>By submitting this form, you agree that {siteConfig.brandName} may contact you about your enquiry. See our <a href="/privacy">Privacy Policy</a> for details.</span></label>
      {status === "error" && <p className="form-error" role="alert">{message}</p>}
      <button className="button button-acid form-submit" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : requestType === "call" ? "Request my discovery call" : "Request my free audit"}<span aria-hidden="true">↗</span></button>
      <p className="form-note">Your details stay private. No mailing lists, no pressure.</p>
    </form>
  );
}
