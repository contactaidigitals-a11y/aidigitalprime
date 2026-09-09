import { ArrowLink, Eyebrow, SiteFooter, SiteHeader } from "./components/SiteChrome";
import { serviceLinks, siteConfig } from "./config";

const serviceCards = [
  {
    number: "01",
    title: "Restaurant ordering & automation",
    href: serviceLinks[0].href,
    text: "Turn website visits and messages into confirmed orders, reservations and properly routed enquiries.",
    outcome: "Hungry → ordered",
    items: ["Collection or delivery order capture", "Automatic confirmations and team alerts", "Reservation, catering and event enquiries"],
  },
  {
    number: "02",
    title: "Booking systems",
    href: serviceLinks[1].href,
    text: "24/7 online booking for barbers, salons and clinics, built around your services, team and availability.",
    outcome: "Interest → booked",
    items: ["Calendar and staff availability setup", "Confirmations and reminders", "Cancellation, rebooking and follow-up flows"],
  },
  {
    number: "03",
    title: "Web design & development",
    href: serviceLinks[2].href,
    text: "Fast, polished websites that explain your offer and make it easy to order, book or enquire.",
    outcome: "Trust → action",
    items: ["Mobile-first design", "Menu, service and local-search pages", "Booking, ordering and lead integrations"],
  },
  {
    number: "04",
    title: "NFC review cards",
    href: serviceLinks[3].href,
    text: "Turn a good in-person experience into a simple tap-to-review journey for your customers.",
    outcome: "Visit → review",
    items: ["NFC card or tag programming", "Google review link with QR backup", "Placement and staff rollout guidance"],
  },
  {
    number: "05",
    title: "AI & admin automation",
    href: serviceLinks[4].href,
    text: "Reduce repetitive admin with carefully scoped automations that keep your team in control.",
    outcome: "Admin → momentum",
    items: ["FAQ and enquiry assistance", "Lead summaries and routing", "Reminder and follow-up workflows"],
  },
  {
    number: "06",
    title: "Local digital growth",
    href: serviceLinks[5].href,
    text: "Help nearby customers find you and see which channels create real orders, bookings and enquiries.",
    outcome: "Seen → chosen",
    items: ["Google Business Profile optimisation", "Local pages and search foundations", "Analytics and conversion tracking"],
  },
];

const frictionPoints = [
  { number: "01", title: "An outdated website", text: "Your online presence does not reflect the quality of the real experience." },
  { number: "02", title: "Missed orders and enquiries", text: "Orders and leads arrive through different channels without a clear route into the business." },
  { number: "03", title: "Too much manual admin", text: "Your team repeats tasks that could be handled more efficiently." },
  { number: "04", title: "A difficult booking journey", text: "Customers have to work too hard to reserve, enquire or make an appointment." },
];

const industries = [
  { className: "restaurant", number: "01", title: "Restaurants & takeaways", headline: "From local search to confirmed order.", text: "Capture collection or delivery orders, reservations and event enquiries without relying on scattered messages.", tags: ["Online orders", "Reservations", "NFC reviews"] },
  { className: "salon", number: "02", title: "Salons & barbers", headline: "From local interest to repeat bookings.", text: "Let clients book around the clock, receive reminders, rebook easily and leave a review with one tap.", tags: ["24/7 booking", "Reminders", "NFC reviews"] },
  { className: "clinic", number: "03", title: "Clinics & practices", headline: "A clearer digital front door.", text: "Give prospective patients trusted information, privacy-conscious forms and a simpler appointment journey.", tags: ["Appointments", "Reminders", "Private enquiries"] },
];

const principles = [
  "Built around how your customers actually decide",
  "Designed to work with existing tools where sensible",
  "Clear scope, deliverables and handover",
  "Performance, accessibility and privacy considered",
  "Honest advice—even when a simpler solution is enough",
];

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-copy">
          <Eyebrow>AI & digital systems for UK service businesses</Eyebrow>
          <h1>Turn local attention into <em>orders & bookings.</em></h1>
          <p className="hero-intro">We build websites, online ordering and booking systems, practical automations and NFC review tools for restaurants, takeaways, barbers, salons and clinics across the UK.</p>
          <div className="hero-actions">
            <a className="button button-dark" href={siteConfig.auditUrl}>Get your free audit <span aria-hidden="true">↗</span></a>
            <ArrowLink href={siteConfig.callUrl}>Book a discovery call</ArrowLink>
          </div>
          <p className="hero-note">No obligation. Clear, practical recommendations.</p>
        </div>
        <div className="system-visual" aria-label="A sample automated enquiry journey">
          <div className="visual-topline"><span>Customer journey</span><span className="live-indicator"><i /> LIVE</span></div>
          <div className="signal-card signal-primary"><span className="signal-icon">01</span><div><small>New customer</small><strong>Order or booking request</strong></div><span className="signal-time">Now</span></div>
          <div className="journey-line" aria-hidden="true"><span /><i /></div>
          <div className="signal-card"><span className="signal-icon muted">AI</span><div><small>Connected system</small><strong>Confirmed & routed</strong></div><span className="status-pill">Ready</span></div>
          <div className="journey-line short" aria-hidden="true"><span /><i /></div>
          <div className="signal-card signal-success"><span className="signal-icon tick">✓</span><div><small>Next step</small><strong>Team ready to deliver</strong></div><span className="signal-time">Done</span></div>
          <div className="visual-caption"><span>LESS FRICTION</span><span className="caption-line" /><span>MORE ACTION</span></div>
        </div>
      </section>

      <section className="proof-strip" aria-label="What we prioritise">
        {["Online orders", "24/7 bookings", "NFC review tools", "Practical automation"].map((item) => <div key={item}><span aria-hidden="true">✦</span>{item}</div>)}
      </section>

      <section className="friction-section">
        <div className="friction-intro">
          <Eyebrow light>The cost of a disconnected journey</Eyebrow>
          <h2>Digital friction quietly costs you business.</h2>
          <p>Customers expect to understand, trust and act within minutes. Every unnecessary step gives them a reason to look elsewhere.</p>
        </div>
        <div className="friction-list">
          {frictionPoints.map((item) => <article key={item.number}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="section-heading">
          <Eyebrow>What we build</Eyebrow>
          <div><h2>Practical systems that solve real business problems.</h2><p className="section-summary">Start with one priority or connect the services around the way your business already works.</p></div>
        </div>
        <div className="service-grid">
          {serviceCards.map((service) => <a className="service-card" href={service.href} key={service.number}><span className="service-number">{service.number}</span><span className="service-outcome">{service.outcome}</span><div><h3>{service.title}</h3><p>{service.text}</p><ul className="service-features">{service.items.map((item) => <li key={item}>{item}</li>)}</ul></div><span className="card-arrow" aria-hidden="true">↗</span></a>)}
        </div>
      </section>

      <section className="industries-section" id="industries">
        <div className="industries-heading"><Eyebrow>Sector focus</Eyebrow><h2>Built for businesses where every enquiry matters.</h2></div>
        <div className="industry-grid">
          {industries.map((industry) => <article className={`industry-card ${industry.className}`} key={industry.number}><div className="industry-art" aria-hidden="true"><span /><i /><b>{industry.number}</b></div><p className="industry-title">{industry.title}</p><h3>{industry.headline}</h3><p className="industry-copy">{industry.text}</p><div className="tag-row">{industry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><ArrowLink href={`/free-audit?sector=${industry.className}`}>Explore the opportunity</ArrowLink></article>)}
        </div>
      </section>

      <section className="principles-section" id="about">
        <div className="principles-panel"><Eyebrow light>Why {siteConfig.brandName}</Eyebrow><h2>Premium execution. <em>Practical thinking.</em></h2><p>Technology should make the customer experience clearer and the work behind it lighter. That is the standard we build around.</p><a className="button button-acid" href={siteConfig.auditUrl}>See what we would improve <span>↗</span></a></div>
        <ol className="principles-list">{principles.map((principle, index) => <li key={principle}><span>0{index + 1}</span><p>{principle}</p><i aria-hidden="true">✓</i></li>)}</ol>
      </section>

      <section className="process-section" id="process">
        <div className="section-heading process-heading"><Eyebrow>How we work</Eyebrow><div><h2>A clear route from friction to progress.</h2><p className="section-summary">A focused process, designed to keep decisions visible and momentum high.</p></div></div>
        <div className="process-grid">
          <article><span>01 / DISCOVER</span><h3>Audit & prioritise</h3><p>We review the customer journey, current systems and the points where useful action is getting lost.</p></article>
          <article><span>02 / CREATE</span><h3>Design & build</h3><p>We shape the solution around your brand, workflow and most valuable commercial priorities.</p></article>
          <article><span>03 / ADVANCE</span><h3>Launch & improve</h3><p>We test the experience, connect the essentials and identify the next sensible improvements.</p></article>
        </div>
      </section>

      <section className="audit-band">
        <div className="audit-orbit" aria-hidden="true"><span>FREE DIGITAL AUDIT • PRACTICAL NEXT STEPS • </span></div>
        <div className="audit-copy"><Eyebrow>Not sure what to fix first?</Eyebrow><h2>Start with clarity.</h2><p>We’ll review the journey from first visit to order, booking or enquiry and highlight the most valuable opportunities.</p><div className="audit-actions"><a className="button button-dark" href={siteConfig.auditUrl}>Request my free audit <span>↗</span></a><ArrowLink href={siteConfig.callUrl}>Book a call</ArrowLink></div></div>
        <ul className="audit-checks">{["Website & mobile experience", "Ordering or booking friction", "Follow-up and reminder gaps", "Google review journey", "Practical automation opportunities"].map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
      </section>
      <SiteFooter />
    </main>
  );
}
