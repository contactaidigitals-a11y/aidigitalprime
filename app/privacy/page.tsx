import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";
import { siteConfig } from "../config";

export const metadata: Metadata = { title: "Privacy Policy" };
export default function PrivacyPage() {
  return <LegalPage title="Privacy policy" intro="A clear summary of how enquiry information is handled on this website.">
    <h2>Information you provide</h2><p>When you submit an audit or call request, we may collect your name, work contact details, business information and anything you choose to include in your message.</p>
    <h2>How we use it</h2><p>We use this information to review and respond to your enquiry, arrange a conversation and provide the service information you requested. We do not add enquiry details to unrelated marketing lists.</p>
    <h2>Service providers</h2><p>Information may be processed by the hosting and email-delivery providers used to operate this website. They process information only to provide those services and support the operation of the site.</p>
    <h2>Retention and your choices</h2><p>Enquiry information should be kept only as long as necessary for the conversation, legal obligations and legitimate business records. You may ask to access, correct or delete your information where applicable.</p>
    <h2>Contact</h2><p>For privacy questions, email <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.</p>
    <p className="legal-note">Last updated: 7 September 2026.</p>
  </LegalPage>;
}
