import type { Metadata } from "next";
import { Eyebrow, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { siteConfig } from "../config";
import { AuditForm } from "./AuditForm";

export const metadata: Metadata = { title: "Free Digital Audit", description: "Request a free, practical review of your website, booking journey and automation opportunities." };

export default function FreeAuditPage() {
  return (
    <main className="audit-page">
      <div className="audit-page-top"><SiteHeader dark /><section className="audit-page-hero"><Eyebrow light>Free digital audit</Eyebrow><h1>Find the friction.<br /><em>Fix what matters.</em></h1><p>Tell us where the current experience feels difficult. We’ll review the details and contact you with a practical next step.</p></section></div>
      <section className="audit-form-section">
        <aside className="audit-sidebar">
          <p className="sidebar-label">What we review</p>
          <ol>{["Website & mobile experience", "Clarity, trust & calls to action", "Booking or enquiry friction", "Follow-up gaps", "Practical automation opportunities"].map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ol>
          <div className="direct-contact"><p>Prefer email?</p><a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a></div>
        </aside>
        <div className="form-card"><div className="form-card-head"><span>01 / YOUR DETAILS</span><p>No obligation. Clear, practical recommendations.</p></div><AuditForm /></div>
      </section>
      <section className="after-submit"><Eyebrow>What happens next</Eyebrow><div><article><span>01</span><h2>We review</h2><p>We look at the information you share and the public-facing customer journey.</p></article><article><span>02</span><h2>We respond</h2><p>We get in touch to clarify the opportunity and arrange the right next step.</p></article><article><span>03</span><h2>You decide</h2><p>You receive practical direction with no obligation to continue.</p></article></div></section>
      <SiteFooter />
    </main>
  );
}
