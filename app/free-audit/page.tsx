import type { Metadata } from "next";
import { Eyebrow, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { siteConfig } from "../config";
import { AuditForm } from "./AuditForm";

export const metadata: Metadata = {
  title: "Free On-Site Hospitality Audit",
  description: "Request a free on-site review of customer demand, the guest journey and day-to-day operations for your hospitality business.",
};

export default function FreeAuditPage() {
  return (
    <main className="audit-page">
      <div className="audit-page-top">
        <SiteHeader dark />
        <section className="audit-page-hero">
          <Eyebrow light>Free on-site business audit</Eyebrow>
          <h1>Understand the business.<br /><em>Improve what matters.</em></h1>
          <p>We visit your restaurant, learn how it works and identify practical opportunities to attract more customers, improve operations—or both.</p>
        </section>
      </div>

      <section className="audit-form-section">
        <aside className="audit-sidebar">
          <p className="sidebar-label">What we review</p>
          <ol>
            {["Customer journey and local demand", "Ordering and service flow", "Reviews and repeat visits", "Website and online presence", "Practical operational improvements"].map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}
          </ol>
          <div className="audit-eligibility">
            <span>Current visit area</span>
            <strong>{siteConfig.location}</strong>
            <p>Outside this area? Leave your details and we’ll confirm whether a visit is practical.</p>
          </div>
        </aside>
        <div className="form-card">
          <div className="form-card-head"><span>01 / YOUR DETAILS</span><p>3 fields · about 30 seconds</p></div>
          <AuditForm source="Free audit page" />
        </div>
      </section>

      <section className="after-submit">
        <Eyebrow>What happens next</Eyebrow>
        <div>
          <article><span>01</span><h2>We do our homework</h2><p>We review your business and public customer journey before contacting you.</p></article>
          <article><span>02</span><h2>We call you</h2><p>We ask a few useful questions and agree a suitable time for the on-site visit.</p></article>
          <article><span>03</span><h2>We visit and prioritise</h2><p>We assess the opportunity and present practical recommendations. You decide what happens next.</p></article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
