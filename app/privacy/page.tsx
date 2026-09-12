import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";
import { siteConfig } from "../config";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" intro="How AI Digital Prime handles the information you share when requesting a business audit or making an enquiry.">
      <h2>Who is responsible for your information</h2>
      <p>{siteConfig.brandName} is responsible for the personal information collected through this website. For privacy questions or requests, email <a href={"mailto:" + siteConfig.contactEmail}>{siteConfig.contactEmail}</a>.</p>

      <h2>Information we collect</h2>
      <p>When you request a free business audit, we collect your name, business name and telephone number. We may also record the page your request came from and any information you later choose to share during a call or visit.</p>

      <h2>How and why we use it</h2>
      <p>We use this information to review your business, confirm that a visit is suitable for our current service area, respond to your request and arrange the on-site audit. This processing is necessary to take steps at your request before a possible business relationship. We do not use audit-request details to add you to unrelated marketing lists.</p>

      <h2>Service providers and sharing</h2>
      <p>Information may be handled by the hosting and email-delivery providers used to operate this website and deliver your request to us. They act only to provide those services. We do not sell your personal information.</p>

      <h2>On-site visits</h2>
      <p>We do not take photographs or recordings during a business visit without permission. We aim to avoid collecting personal information about customers or staff unless it is genuinely needed and appropriately agreed.</p>

      <h2>How long we keep it</h2>
      <p>Unsuccessful enquiry records are normally deleted or anonymised within 12 months of the last contact. If you become a client, relevant information may be kept for longer where needed for contracts, tax, legal obligations or legitimate business records.</p>

      <h2>Your rights</h2>
      <p>Depending on the circumstances, you may ask for access to your information, correction, deletion, restriction or portability, and you may object to certain uses. You can contact us using the email above. You also have the right to raise a concern with the UK Information Commissioner’s Office.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this notice when our services or the way this website works changes. The latest version will remain available on this page.</p>
      <p className="legal-note">Last updated: 12 September 2026.</p>
    </LegalPage>
  );
}
