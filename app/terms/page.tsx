import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";
import { siteConfig } from "../config";

export const metadata: Metadata = { title: "Website Terms" };
export default function TermsPage() {
  return <LegalPage title="Website terms" intro="The basic terms that apply when you browse this website or submit an enquiry.">
    <h2>Website information</h2><p>The content on this site is general information about potential digital services. It is not a binding proposal, guarantee of results or professional legal, financial or medical advice.</p>
    <h2>Enquiries and proposals</h2><p>Submitting a form does not create a client relationship. Any project begins only after scope, responsibilities, fees and terms are agreed in writing.</p>
    <h2>Accuracy and availability</h2><p>We aim to keep the site useful and accurate, but information may change and uninterrupted availability cannot be guaranteed.</p>
    <h2>Intellectual property</h2><p>Unless otherwise stated, the site’s original design, copy and brand material may not be reproduced commercially without permission.</p>
    <h2>Contact</h2><p>Questions about these terms can be sent to <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.</p>
    <p className="legal-note">Last updated: 7 September 2026.</p>
  </LegalPage>;
}
