import { ArrowLink, Eyebrow, SiteFooter, SiteHeader } from "./components/SiteChrome";
import { siteConfig } from "./config";
import { AuditForm } from "./free-audit/AuditForm";

const outcomes = [
  {
    id: "customers",
    number: "01",
    kicker: "Demand",
    title: "Get more customers",
    text: "Help more local customers discover your business, understand what you offer and choose you.",
    items: ["A clearer website and enquiry journey", "Google visibility and local offers", "NFC and QR tools that make reviews easier"],
    result: "More visibility. More trust. More reasons to visit.",
  },
  {
    id: "operations",
    number: "02",
    kicker: "Efficiency",
    title: "Improve operations",
    text: "Remove avoidable steps from ordering, enquiries and everyday admin so your team can focus on service.",
    items: ["Booking, ordering and enquiry systems", "Clear confirmations and team alerts", "Practical automations around your workflow"],
    result: "Less friction. Fewer missed requests. Smoother service.",
  },
  {
    id: "audit-overview",
    number: "03",
    kicker: "Clarity",
    title: "Free business audit",
    text: "We visit your business, understand how it runs and identify the improvements worth prioritising.",
    items: ["Website and customer journey review", "Bookings, enquiries and system review", "A written report with prioritised actions"],
    result: "Relevant recommendations, without the generic sales pitch.",
  },
];

const solutions = [
  {
    number: "01",
    title: "Restaurant ordering systems",
    text: "A simpler way to receive and manage the orders that matter to your business.",
    items: ["Collection or delivery order capture", "Table ordering and QR menu journeys", "Automatic confirmations and team notifications"],
    label: "Orders",
    href: "/services/restaurant-automation",
  },
  {
    number: "02",
    title: "Websites & local visibility",
    text: "A professional digital front door that makes your offer clear and turns local interest into action.",
    items: ["Fast, mobile-first business websites", "Clear service pages and enquiry forms", "Google presence and local-search foundations"],
    label: "Growth",
    href: "/services/web-design",
  },
  {
    number: "03",
    title: "NFC review systems",
    text: "Configured cards and stands that make it easy for customers to share an honest Google review.",
    items: ["NFC card or table-stand programming", "Direct Google review link with QR backup", "Placement and team rollout guidance"],
    label: "Reputation",
    href: "/services/nfc-review-cards",
  },
  {
    number: "04",
    title: "Booking systems & automation",
    text: "Online appointments for barbers, salons, clinics and service businesses, with less back-and-forth for your team.",
    items: ["Appointment calendars and booking pages", "Confirmations, reminders and enquiry routing", "AI-assisted workflows and admin automation"],
    label: "Bookings",
    href: "/services/booking-systems",
  },
];

const process = [
  { number: "01", title: "Request your visit", text: "Leave your name, business name and phone number. We review your business before contacting you." },
  { number: "02", title: "We visit your business", text: "We discuss your goals and look at the customer journey, bookings, orders and current systems." },
  { number: "03", title: "Receive a practical plan", text: "We prepare a written report and explain the strongest opportunities in person. You decide whether any recommendation goes further." },
];

export default function Home() {
  return (
    <main className="hospitality-home">
      <SiteHeader />

      <section className="hospitality-hero">
        <div className="hospitality-hero-copy">
          <Eyebrow>Local businesses · Harlow & nearby areas</Eyebrow>
          <h1>More customers.<br />Smoother operations.<br /><em>A stronger business.</em></h1>
          <p>Professional websites, restaurant ordering, online bookings, AI automation and NFC review cards. We help restaurants, salons, barbers, clinics and other local businesses turn enquiries into action—and spend less time on admin. Start with a free on-site business audit.</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#audit">Request your free audit <span aria-hidden="true">↗</span></a>
            <ArrowLink href="#outcomes">See what we improve</ArrowLink>
          </div>
          <div className="hospitality-hero-note">
            <span aria-hidden="true">✓</span>
            <p><strong>Free and without obligation.</strong> We review your business before calling to arrange the visit.</p>
          </div>
        </div>

        <aside className="audit-preview" aria-label="What the free business audit covers">
          <div className="audit-preview-head">
            <div><span>Free on-site review</span><strong>Business opportunity audit</strong></div>
            <span className="audit-status"><i /> Local</span>
          </div>
          <div className="audit-scope">
            <article><span>01</span><div><small>Customer demand</small><strong>How local customers find and choose you</strong></div><b>Review</b></article>
            <article><span>02</span><div><small>Customer journey</small><strong>From first search to booking or order</strong></div><b>Review</b></article>
            <article><span>03</span><div><small>Operations</small><strong>Where time, orders or enquiries get lost</strong></div><b>Review</b></article>
          </div>
          <div className="audit-preview-result">
            <span>What you receive</span>
            <p>A prioritised, practical improvement plan.</p>
          </div>
          <div className="audit-preview-foot"><span>ON-SITE</span><i /><span>PRACTICAL</span><i /><span>NO OBLIGATION</span></div>
        </aside>
      </section>

      <section className="trust-strip" aria-label="Our approach">
        <div><span>01</span><p><strong>Hospitality insight</strong>Hands-on understanding of service businesses</p></div>
        <div><span>02</span><p><strong>Management thinking</strong>Recommendations connected to real priorities</p></div>
        <div><span>03</span><p><strong>Practical systems</strong>Technology chosen only where it helps</p></div>
      </section>

      <section className="outcomes-section" id="outcomes">
        <div className="section-introduction">
          <Eyebrow>What we improve</Eyebrow>
          <div>
            <h2>Start with the business problem—not a piece of technology.</h2>
            <p>We look at where your business is today, what is holding it back and which improvements could make the biggest practical difference.</p>
          </div>
        </div>
        <div className="outcomes-grid">
          {outcomes.map((outcome) => (
            <article className="outcome-card" id={outcome.id} key={outcome.number}>
              <div className="outcome-card-top"><span>{outcome.number}</span><small>{outcome.kicker}</small></div>
              <h3>{outcome.title}</h3>
              <p>{outcome.text}</p>
              <ul>{outcome.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <strong className="outcome-result">{outcome.result}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="restaurant-lens">
        <div className="restaurant-lens-heading">
          <Eyebrow light>Every business is different</Eyebrow>
          <h2>Not every business has the same problem.</h2>
          <p>The audit identifies which side needs attention first—and where a joined-up plan can improve both.</p>
        </div>
        <div className="restaurant-lens-grid">
          <article>
            <span className="lens-label">When you need more customers</span>
            <h3>Make the business easier to find, trust and choose.</h3>
            <ul><li>Local visibility</li><li>Website and service pages</li><li>Reviews and reputation</li><li>Offers and repeat business</li></ul>
          </article>
          <article>
            <span className="lens-label">When service is already busy</span>
            <h3>Make bookings, orders and daily admin easier to manage.</h3>
            <ul><li>Online ordering</li><li>Appointment booking</li><li>Team notifications</li><li>Admin automation</li></ul>
          </article>
        </div>
      </section>

      <section className="solutions-section" id="solutions">
        <div className="section-introduction">
          <Eyebrow>What we can implement</Eyebrow>
          <div>
            <h2>Practical solutions, selected after we understand the business.</h2>
            <p>The audit is the starting point. If there is a clear opportunity, these are the kinds of systems we can design, configure and put into use.</p>
          </div>
        </div>
        <div className="solutions-grid">
          {solutions.map((solution) => (
            <article className="solution-card" key={solution.number}>
              <div className="solution-card-head"><span>{solution.number}</span><small>{solution.label}</small></div>
              <h3>{solution.title}</h3>
              <p>{solution.text}</p>
              <ul>{solution.items.map((item) => <li key={item}><span aria-hidden="true">↗</span>{item}</li>)}</ul>
              <ArrowLink href={solution.href}>Explore {solution.title.toLowerCase()}</ArrowLink>
            </article>
          ))}
        </div>
      </section>

      <section className="expertise-section" id="expertise">
        <div className="expertise-statement">
          <Eyebrow light>Why AI Digital Prime</Eyebrow>
          <h2>Business first.<br /><em>Technology second.</em></h2>
          <p>Good digital tools matter only when they solve the right problem. That is why every recommendation begins with how your business attracts customers and runs day to day.</p>
        </div>
        <div className="expertise-proof">
          <span className="proof-kicker">A practical point of view</span>
          <h3>Hospitality insight, strengthened by smart systems.</h3>
          <p>AI Digital Prime combines hands-on hospitality and management experience with a practical understanding of digital systems. We look beyond marketing alone—at how customers find you, what they experience and how the business runs behind the scenes.</p>
          <ul>
            <li><span>01</span>Recommendations shaped around your business</li>
            <li><span>02</span>Clear priorities and honest commercial thinking</li>
            <li><span>03</span>No generic package and no obligation to continue</li>
          </ul>
        </div>
      </section>

      <section className="hospitality-process" id="process">
        <div className="section-introduction">
          <Eyebrow>How it works</Eyebrow>
          <div><h2>A useful first conversation starts before we call.</h2><p>We do a little homework first, then make the visit focused, relevant and worth your time.</p></div>
        </div>
        <div className="hospitality-process-grid">
          {process.map((step) => <article data-step={step.number} key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}
        </div>
      </section>

      <section className="hospitality-audit" id="audit">
        <div className="hospitality-audit-copy">
          <Eyebrow light>Free on-site business audit</Eyebrow>
          <h2>See where your business could perform better.</h2>
          <p>Leave your name, business name and phone number. We review your business before contacting you, then call to arrange a suitable time for the visit.</p>
          <ul>
            <li><span>✓</span>Customer demand and local visibility</li>
            <li><span>✓</span>Website, service pages and customer journey</li>
            <li><span>✓</span>Bookings, orders and operational flow</li>
            <li><span>✓</span>Reviews, repeat visits and practical systems</li>
          </ul>
          <div className="audit-area"><small>Currently available in</small><strong>{siteConfig.location}</strong></div>
        </div>
        <div className="hospitality-form-card">
          <div className="hospitality-form-head"><span>YOUR DETAILS</span><p>3 fields · about 30 seconds</p></div>
          <AuditForm source="Homepage" />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
