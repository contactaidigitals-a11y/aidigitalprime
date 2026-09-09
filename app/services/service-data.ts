export type ServiceDetail = {
  slug: string;
  index: string;
  kicker: string;
  title: string;
  intro: string;
  promise: string;
  problems: { title: string; text: string }[];
  inclusions: string[];
  examples: { sector: string; title: string; text: string }[];
  faqs: { question: string; answer: string }[];
  cta: string;
};

export const services: Record<string, ServiceDetail> = {
  "restaurant-automation": {
    slug: "restaurant-automation",
    index: "01",
    kicker: "Restaurant ordering & automation",
    title: "Take more orders without creating more admin.",
    intro: "We design connected ordering and enquiry journeys for restaurants and takeaways—from menus and collection or delivery choices to confirmations and team hand-off. Where sensible, we connect the tools you already use.",
    promise: "A simpler route from hungry customer to confirmed order, with fewer missed messages and manual steps.",
    problems: [
      { title: "Orders arrive everywhere", text: "Phone calls, direct messages and website enquiries are easy to miss during a busy service." },
      { title: "Customers cannot order quickly", text: "Menus are difficult to use on mobile, options are unclear or the route to checkout takes too long." },
      { title: "Staff repeat the same admin", text: "Teams manually confirm orders, copy details and route catering or event enquiries." },
    ],
    inclusions: ["Online ordering flow for collection or delivery", "Digital menu, options and add-on setup", "Payment integration where required", "Automatic customer confirmations and team alerts", "Reservation, catering and private-hire enquiry routing", "Connection to existing systems where practical"],
    examples: [
      { sector: "Restaurants", title: "Direct orders from your own website", text: "Give guests a clear mobile journey from menu choice to payment and confirmation." },
      { sector: "Takeaways", title: "Fewer phone interruptions", text: "Capture collection or delivery details accurately and send the order to the right place." },
      { sector: "Events & catering", title: "Better-qualified enquiries", text: "Collect dates, guest numbers, budget and requirements before the team follows up." },
    ],
    faqs: [
      { question: "Can you connect our existing ordering or POS system?", answer: "Often, yes. We first review the integrations available and recommend the cleanest route, without replacing a tool that already works well." },
      { question: "Can customers pay online?", answer: "Yes, where online payment is part of the agreed setup. We can connect an appropriate payment provider and make the checkout journey clear on mobile." },
      { question: "Does this work for reservations and private events too?", answer: "Yes. We can keep standard orders simple while routing reservations, group dining, catering and private-hire enquiries through dedicated flows." },
    ],
    cta: "Plan your ordering system",
  },
  "web-design": {
    slug: "web-design",
    index: "03",
    kicker: "Website design & development",
    title: "A website that earns trust—and makes the next step obvious.",
    intro: "We design polished, mobile-first websites for service businesses that need to turn attention into reservations, appointments and qualified enquiries.",
    promise: "Built to look premium, load quickly and guide customers towards action.",
    problems: [
      { title: "It looks behind the business", text: "The real customer experience feels better than the website that represents it." },
      { title: "The next step is unclear", text: "Visitors browse, but calls to action are hidden, inconsistent or ask for too much." },
      { title: "Mobile feels like an afterthought", text: "Pages are difficult to scan precisely where most local customers discover you." },
    ],
    inclusions: ["Conversion-focused structure and messaging", "Responsive, mobile-first design", "Booking and enquiry integrations", "Performance and technical foundations", "Analytics and conversion tracking", "Clear content-management handover"],
    examples: [
      { sector: "Restaurants", title: "From appetite to reservation", text: "Menus, atmosphere and essential details arranged around a fast route to the booking table." },
      { sector: "Salons & barbers", title: "Services made easy to choose", text: "Clear treatment, pricing and team presentation with direct access to the booking calendar." },
      { sector: "Clinics & practices", title: "A calmer first impression", text: "Reassuring information architecture, practitioner profiles and privacy-conscious enquiries." },
    ],
    faqs: [
      { question: "Can you work with our existing brand?", answer: "Yes. We can build within an established identity or refine the digital expression where it needs more clarity and consistency." },
      { question: "Will we be able to update the site?", answer: "Yes. We agree the right editing setup during scoping and provide a clear handover for the content your team needs to manage." },
      { question: "Can you connect our current booking tool?", answer: "Usually. We first review the tool and customer journey, then recommend the cleanest integration rather than replacing software without a reason." },
    ],
    cta: "Plan your new website",
  },
  "booking-systems": {
    slug: "booking-systems",
    index: "02",
    kicker: "Booking & lead systems",
    title: "From first click to confirmed booking.",
    intro: "Bring forms, calendars, notifications and follow-up into one clearer journey, making it easier for customers to act and for your team to stay organised.",
    promise: "Fewer gaps between interest, response and a confirmed next step.",
    problems: [
      { title: "Enquiries arrive everywhere", text: "Messages are scattered across inboxes, social channels and forms with no shared view." },
      { title: "Follow-up depends on memory", text: "Busy teams respond inconsistently, and warm opportunities quietly go cold." },
      { title: "Booking takes too many steps", text: "Customers repeat information, wait for availability or cannot complete the journey on mobile." },
    ],
    inclusions: ["Booking or enquiry-flow design", "Calendar and reservation integrations", "Lead capture and intelligent routing", "Confirmation and reminder journeys", "CRM or pipeline setup where appropriate", "Tracking across key conversion points"],
    examples: [
      { sector: "Restaurants", title: "Complex enquiries, organised", text: "Route group dining, events and private-hire requests to the right person with the right context." },
      { sector: "Salons & barbers", title: "A cleaner appointment path", text: "Connect services, team availability, reminders and rebooking without adding admin." },
      { sector: "Clinics & practices", title: "Appropriate next steps", text: "Separate general questions from appointment requests using privacy-conscious forms and routing." },
    ],
    faqs: [
      { question: "Do we need to replace our booking software?", answer: "Not necessarily. We prefer to improve and connect tools that already work before recommending a replacement." },
      { question: "Can the system send reminders?", answer: "Yes, where supported by your booking or communication tools. We map timing and content to the experience you want customers to have." },
      { question: "Will staff still have control?", answer: "Always. Automations can prepare, route and notify, while exceptions and sensitive decisions stay with your team." },
    ],
    cta: "Improve your booking journey",
  },
  "ai-automation": {
    slug: "ai-automation",
    index: "05",
    kicker: "AI automation",
    title: "Automate repetitive work without losing the human touch.",
    intro: "We use AI where it adds practical value: helping your team respond faster, organise enquiries and reduce repetitive admin while keeping people in control.",
    promise: "Useful automation with clear oversight—not AI for its own sake.",
    problems: [
      { title: "The same questions, every day", text: "Your team repeatedly answers routine enquiries across several channels." },
      { title: "Information needs manual sorting", text: "Staff copy, summarise and route details before useful work can begin." },
      { title: "Good follow-up slips", text: "Reminders, review requests and internal updates compete with higher-priority work." },
    ],
    inclusions: ["Frequently asked question assistance", "Enquiry classification and routing", "Internal summaries and notifications", "Appointment reminders and follow-up", "Review-request workflows", "Operational reporting"],
    examples: [
      { sector: "Restaurants", title: "Faster event responses", text: "Summarise private-dining requests, identify missing details and notify the right manager." },
      { sector: "Salons & barbers", title: "Routine follow-up, handled", text: "Support reminders, rebooking prompts and review requests at sensible moments." },
      { sector: "Clinics & practices", title: "Admin support with boundaries", text: "Organise non-clinical enquiries while keeping medical decisions firmly with qualified people." },
    ],
    faqs: [
      { question: "Does AI replace our staff?", answer: "No. The aim is to remove low-value repetition and help your team act on better-organised information." },
      { question: "What happens when the system is unsure?", answer: "We design clear fallbacks. Ambiguous, sensitive or unusual cases are handed to a person rather than guessed." },
      { question: "Can you work with our existing tools?", answer: "Often, yes. The first step is checking integrations, data access and whether automation genuinely improves the workflow." },
    ],
    cta: "Explore an automation opportunity",
  },
  "nfc-review-cards": {
    slug: "nfc-review-cards",
    index: "04",
    kicker: "NFC review cards & setup",
    title: "Make leaving a genuine Google review as easy as one tap.",
    intro: "We programme NFC cards or tags to open the correct Google review page, add a QR-code backup and help your team use them at the right customer moments.",
    promise: "A professional, low-friction review request system your team can start using immediately.",
    problems: [
      { title: "Happy customers forget", text: "People intend to leave a review, but the moment passes once they leave your venue." },
      { title: "The link is hard to find", text: "Searching for the business, finding the right profile and opening the review screen creates unnecessary friction." },
      { title: "Staff ask inconsistently", text: "Without a simple tool and clear guidance, review requests depend on memory and confidence." },
    ],
    inclusions: ["NFC card or tag programming", "Direct Google review destination setup", "QR-code backup for every device", "Simple branded instruction artwork", "Placement and customer-moment guidance", "Staff rollout and usage guidance"],
    examples: [
      { sector: "Restaurants", title: "A tap at the end of a great meal", text: "Place a programmed card at the bill or counter so guests can reach the review screen in seconds." },
      { sector: "Salons & barbers", title: "Turn the finished look into feedback", text: "Make the review request part of a natural checkout conversation without adding pressure." },
      { sector: "Clinics & practices", title: "A discreet, consistent request", text: "Offer an easy route to honest feedback while respecting the tone and privacy of the setting." },
    ],
    faqs: [
      { question: "Do customers need an app?", answer: "No. Most modern phones open the link when the customer taps the NFC card. The QR code provides a simple backup." },
      { question: "Can the card link directly to our Google review screen?", answer: "Yes. We configure the correct destination so the customer avoids extra searching and unnecessary steps." },
      { question: "Do you filter negative reviews?", answer: "No. The setup should invite honest feedback from every customer; it never filters, gates or manipulates reviews." },
    ],
    cta: "Set up your review cards",
  },
  "digital-growth": {
    slug: "digital-growth",
    index: "06",
    kicker: "Digital growth & optimisation",
    title: "Improve what happens after your website goes live.",
    intro: "Use clear data and focused improvements to strengthen local visibility, understand customer behaviour and remove friction from the digital journey.",
    promise: "Practical priorities, measured clearly and improved deliberately.",
    problems: [
      { title: "Traffic without clarity", text: "You can see visits, but not which actions matter or where promising customers drop away." },
      { title: "Local discovery is inconsistent", text: "Business information, landing pages and search foundations do not reinforce one another." },
      { title: "Changes rely on opinion", text: "The site evolves without a clear hypothesis, baseline or way to judge improvement." },
    ],
    inclusions: ["Local-search foundations", "Analytics and conversion setup", "Landing-page improvements", "Customer-journey reviews", "Content and call-to-action optimisation", "Ongoing performance support"],
    examples: [
      { sector: "Restaurants", title: "Own the local decision moment", text: "Align venue details, menu journeys and landing pages with how nearby guests actually search." },
      { sector: "Salons & barbers", title: "Turn discovery into demand", text: "Strengthen service pages, booking calls to action and local signals around high-intent searches." },
      { sector: "Clinics & practices", title: "Clarity before conversion", text: "Help prospective patients find appropriate information and understand the right next step." },
    ],
    faqs: [
      { question: "Do you guarantee search rankings or leads?", answer: "No credible partner can guarantee either. We improve the foundations, measure the journey and prioritise work with a clear commercial rationale." },
      { question: "Can you improve our current website?", answer: "Yes. A focused optimisation programme may be more valuable than a full rebuild when the underlying site is sound." },
      { question: "What do you report on?", answer: "We agree meaningful actions first—such as qualified enquiries or completed bookings—then keep reporting focused on decisions, not vanity metrics." },
    ],
    cta: "Find your next growth opportunity",
  },
};
