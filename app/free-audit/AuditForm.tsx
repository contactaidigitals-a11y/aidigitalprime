"use client";

import { FormEvent, useRef, useState } from "react";
import { siteConfig } from "../config";
import { WhatsAppLink } from "../components/WhatsAppLink";

type FormStatus = "idle" | "sending" | "success" | "error";

export function AuditForm({ source = "Website" }: { source?: string }) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
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
      const result: unknown = await response.json().catch(() => null);
      const accepted = result && typeof result === "object" && "ok" in result && result.ok === true;
      if (!response.ok || !accepted) {
        const failureMessage = result && typeof result === "object" && "message" in result && typeof result.message === "string"
          ? result.message
          : "We couldn’t send your request right now. Please try again shortly.";
        throw new Error(failureMessage);
      }
      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error && !(error instanceof TypeError) ? error.message : "We couldn’t connect. Please check your connection and try again.");
    } finally {
      submitting.current = false;
    }
  }

  if (status === "success") {
    return (
      <div className="form-success compact-success" role="status">
        <span aria-hidden="true">✓</span>
        <p>Interest received</p>
        <h2>Thank you. We’ll review your business first.</h2>
        <p>We’ll call you to understand your priorities and arrange a suitable time for the free visit.</p>
        <button type="button" onClick={() => setStatus("idle")}>Send another request</button>
        <div className="form-contact-options"><p>Want to add anything?</p><WhatsAppLink /></div>
      </div>
    );
  }

  return (
    <>
    <form className="audit-form compact-audit-form" onSubmit={handleSubmit} aria-busy={status === "sending"}>
      <input type="hidden" name="requestType" value="free-on-site-business-audit" />
      <input type="hidden" name="sourcePage" value={source} />
      <div className="field-grid field-grid-compact">
        <label>
          <span>Your name *</span>
          <input name="name" autoComplete="name" required maxLength={100} placeholder="Your full name" />
        </label>
        <label>
          <span>Business name *</span>
          <input name="businessName" autoComplete="organization" required maxLength={140} placeholder="Your business name" />
        </label>
        <label>
          <span>Phone number *</span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required minLength={7} maxLength={20} placeholder="Your best contact number" />
        </label>
      </div>
      <label className="honeypot" aria-hidden="true">Leave this field empty<input name="companyFax" tabIndex={-1} autoComplete="off" /></label>
      <p className="privacy-note">By submitting, you ask {siteConfig.brandName} to contact you about a free business audit. We do not add your details to a mailing list. See our <a href="/privacy">Privacy Policy</a>.</p>
      {status === "error" && <p className="form-error" role="alert">{message}</p>}
      <button className="button button-acid form-submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Request my free on-site audit"}<span aria-hidden="true">↗</span>
      </button>
      <p className="form-note">No obligation. We review your business before calling.</p>
    </form>
    <div className="form-contact-options">
      <p>Prefer to message us directly?</p>
      <WhatsAppLink />
      <a className="form-email-link" href={`mailto:${siteConfig.contactEmail}`}>Or email {siteConfig.contactEmail}</a>
      <small>WhatsApp opens separately. Your form details are not shared unless you send them.</small>
    </div>
    </>
  );
}
