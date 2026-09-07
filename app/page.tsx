import Link from "next/link";
import { ArrowLink, Eyebrow, SiteFooter, SiteHeader } from "./components/SiteChrome";
import { serviceLinks, siteConfig } from "./config";

const serviceCards = [
  { number: "01", title: "Website design", href: serviceLinks[0].href, text: "Fast, polished websites that build confidence and make the next step obvious.", outcome: "Trust → action" },
  { number: "02", title: "Booking systems", href: serviceLinks[1].href, text: "Connected forms, calendars and follow-up that move enquiries towards bookings.", outcome: "Interest → booked" },
  { number: "03", title: "AI automation", href: serviceLinks[2].href, text: "Thoughtful automation for repetitive enquiries, reminders, routing and workflows.", outcome: "Admin → momentum" },
  { number: "04", title: "Digital growth", href: serviceLinks[3].href, text: "Focused improvements to local visibility, conversion tracking and performance.", outcome: "Data → decisions" },
];

const frictionPoints = [
  { number: "01", title: "An outdated website", text: "Your online presence does not reflect the quality of the real experience." },
  { number: "02", title: "Lost enquiries", text: "Leads arrive through different channels without a clear follow-up process." },
  { number: "03", title: "Too much manual admin", text: "Your team repeats tasks that could be handled more efficiently." },
  { number: "04", title: "A difficult booking journey", text: "Customers have to work too hard to reserve, enquire or make an appointment." },
];

const industries = [
  { className: "restaurant", number: "01", title: "Restaurants", headline: "From search to table.", text: "Help guests discover the experience, find the essentials and reserve with less friction.", tags: ["Reservations", "Menus", "Private dining"] },
  { className: "salon", number: "02", title: "Salons & barbers", headline: "From local interest to repeat bookings.", text: "Make services easy to understand, appointments simple to book and returning feel natural.", tags: ["Online booking", "Rebooking", "Reviews"] },
  { className: "clinic", number: "03", title: "Clinics & practices", headline: "A clearer digital front door.", text: "Give prospective patients the clarity and confidence to take the next appropriate step.", tags: ["Clear pathways", "Private enquiries", "Accessibility"] },
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
          <h1>Turn more enquiries into <em>bookings.</em></h1>
          <p className="hero-intro">Premium websites, smoother booking journeys and practical AI automations for restaurants, salons, barbers and clinics.</p>
          <div className="hero-actions">
            <Link className="button button-dark" href={siteConfig.auditUrl}>Get your free audit <span aria-hidden="true">↗</span></Link>
            <ArrowLink href={siteConfig.callUrl}>Book a discovery call</ArrowLink>
          </div>
          <p className="hero-note">No obligation. Clear, practical recommendations.</p>
        </div>
        <div className="system-visual" aria-label="A sample automated enquiry journey">
          <div className="visual-topline"><span>Customer journey</span><span className="live-indicator"><i /> LIVE</span></div>
          <div className="signal-card signal-primary"><span className="signal-icon">01</span><div><small>New enquiry</small><strong>Private booking request</strong></div><span className="signal-time">Now</span></div>
          <div className="journey-line" aria-hidden="true"><span /><i /></div>
          <div className="signal-card"><span className="signal-icon muted">AI</span><div><small>Smart follow-up</small><strong>Qualified & routed</strong></div><span className="status-pill">Ready</span></div>
          <div className="journey-line short" aria-hidden="true"><span /><i /></div>
          <div className="signal-card signal-success"><span className="signal-icon tick">✓</span><div><small>Next step</small><strong>Booking confirmed</strong></div><span className="signal-time">Done</span></div>
          <div className="visual-caption"><span>LESS FRICTION</span><span className="caption-line" /><span>MORE ACTION</span></div>
        </div>
      </section>

      <section className="proof-strip" aria-label="What we prioritise">
        {["Conversion-first", "Practical AI", "Built around your workflow", "UK-focused"].map((item) => <div key={item}><span aria-hidden="true">✦</span>{item}</div>)}
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
          <div><h2>Everything your digital customer journey needs.</h2><p className="section-summary">One connected view of the journey—from first impression to follow-up.</p></div>
        </div>
        <div className="service-grid">
          {serviceCards.map((service) => <Link className="service-card" href={service.href} key={service.number}><span className="service-number">{service.number}</span><span className="service-outcome">{service.outcome}</span><div><h3>{service.title}</h3><p>{service.text}</p></div><span className="card-arrow" aria-hidden="true">↗</span></Link>)}
        </div>
      </section>

      <section className="industries-section" id="industries">
        <div className="industries-heading"><Eyebrow>Sector focus</Eyebrow><h2>Built for businesses where every enquiry matters.</h2></div>
        <div className="industry-grid">
          {industries.map((industry) => <article className={`industry-card ${industry.className}`} key={industry.number}><div className="industry-art" aria-hidden="true"><span /><i /><b>{industry.number}</b></div><p className="industry-title">{industry.title}</p><h3>{industry.headline}</h3><p className="industry-copy">{industry.text}</p><div className="tag-row">{industry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><ArrowLink href={`/free-audit?sector=${industry.className}`}>Explore the opportunity</ArrowLink></article>)}
        </div>
      </section>

      <section className="principles-section" id="about">
        <div className="principles-panel"><Eyebrow light>Why {siteConfig.brandName}</Eyebrow><h2>Premium execution. <em>Practical thinking.</em></h2><p>Technology should make the customer experience clearer and the work behind it lighter. That is the standard we build around.</p><Link className="button button-acid" href={siteConfig.auditUrl}>See what we would improve <span>↗</span></Link></div>
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
        <div className="audit-copy"><Eyebrow>Not sure what to fix first?</Eyebrow><h2>Start with clarity.</h2><p>We’ll review the journey from first visit to booked customer and highlight the most valuable opportunities across your website, booking flow and follow-up.</p><div className="audit-actions"><Link className="button button-dark" href={siteConfig.auditUrl}>Request my free audit <span>↗</span></Link><ArrowLink href={siteConfig.callUrl}>Book a call</ArrowLink></div></div>
        <ul className="audit-checks">{["Website & mobile experience", "Trust and calls to action", "Booking or enquiry friction", "Follow-up gaps", "Practical automation opportunities"].map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
      </section>
      <SiteFooter />
    </main>
  );
}
