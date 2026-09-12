import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";
import { siteConfig } from "../config";

export const metadata: Metadata = { title: "Website Terms" };

export default function TermsPage() {
  return (
    <LegalPage title="Website terms" intro="The basic terms that apply when you browse this website or request a free business audit.">
      <h2>Website information</h2>
      <p>The content on this website is general information about hospitality business improvement and potential digital services. It is not a binding proposal, a guarantee of results or professional legal, financial or tax advice.</p>

      <h2>Free business audits</h2>
      <p>Free on-site audits are subject to suitability, availability and our current travel area. Submitting the form is a request, not a confirmed appointment. We will contact you to understand the business and agree whether and when a visit can take place.</p>

      <h2>Recommendations and projects</h2>
      <p>Audit observations and recommendations are non-binding and based on the information reasonably available at the time. You remain responsible for business decisions. Any paid project begins only after the scope, responsibilities, fees and terms are agreed in writing.</p>

      <h2>Accuracy and availability</h2>
      <p>We aim to keep the website useful and accurate, but information may change and uninterrupted availability cannot be guaranteed.</p>

      <h2>Intellectual property</h2>
      <p>Unless otherwise stated, the website’s original design, copy and brand material may not be reproduced commercially without permission.</p>

      <h2>Contact</h2>
      <p>Questions about these terms can be sent to <a href={"mailto:" + siteConfig.contactEmail}>{siteConfig.contactEmail}</a>.</p>
      <p className="legal-note">Last updated: 12 September 2026.</p>
    </LegalPage>
  );
}
