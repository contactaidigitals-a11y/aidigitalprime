import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";
import { siteConfig } from "../config";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" intro="How AI Digital Prime handles the information you share when requesting a business audit or applying to become an independent sales partner.">
      <h2>Who is responsible for your information</h2>
      <p>{siteConfig.brandName} is responsible for the personal information collected through this website. For privacy questions or requests, email <a href={"mailto:" + siteConfig.contactEmail}>{siteConfig.contactEmail}</a>.</p>

      <h2>Independent sales partner applications</h2>
      <p>When you apply to work with us as an independent sales partner, CALINESCU TECHNOLOGIES LTD (company number 17536696, 255 Arkwrights, Harlow, Essex CM20 3NE, United Kingdom) collects your first and last name, email address, phone number, town or city, languages and proficiency, a declaration about your right to work in the UK, and any experience or CV you choose to provide. Nationality is optional and should not be used as a substitute for checking permission to work. Please do not send identity documents at this stage.</p>
      <p>We use application information to assess suitability, communicate about the opportunity, and take steps you request before potentially entering an independent contractor agreement. Depending on the activity and circumstances, our lawful bases are steps before entering into a contract and our legitimate interests in selecting business partners. We do not require consent as the lawful basis for assessing applications. We do not use these details to add you to unrelated marketing lists.</p>
      <p>Application details and optional CVs are delivered to our restricted recruitment inbox using our email delivery provider. Access should be limited to people responsible for recruitment. Unsuccessful applications are ordinarily deleted after six months unless there is a documented reason to retain them longer, for example a legal claim; successful applicant details may be retained in the contractor relationship records as necessary. Please contact us to exercise your rights or ask about retention.</p>

      <h2>AI voice and website chat demonstrations</h2>
      <p>Our site may process business information you enter into a personalised voice demo, plus microphone audio during your live session, through ElevenLabs. Questions typed into our website chatbot may be processed by an AI service provider to respond to your request. Do not enter passwords or sensitive personal information. AI responses can be inaccurate and demonstrations do not make real bookings. Provider processing, security logs and any international transfers must be assessed against deployed configurations and applicable safeguards. Voice recordings, monitoring and retention settings should be confirmed before any recruitment interviews are activated.</p>

      <h2>Technical data and cookies</h2>
      <p>Hosting services may process IP addresses, browser information and security logs to operate and protect the site. Google Fonts or other third-party resources may receive technical request information when they load. Non-essential analytics or advertising cookies must not be enabled without appropriate disclosure and consent.</p>

      <h2>Automated recruitment interviews</h2>
      <p>Where an optional AI introductory interview is offered, it will explain that it is an AI interaction and disclose any active human monitoring or recording before the call. The AI may describe the role and summarise answers for our team, but does not make final recruitment decisions. A person reviews candidate applications and decides whether to offer a contract.</p>

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
      <p className="legal-note">Last updated: 13 November 2026.</p>
    </LegalPage>
  );
}
