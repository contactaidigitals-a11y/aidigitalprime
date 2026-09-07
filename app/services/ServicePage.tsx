import Link from "next/link";
import { ArrowLink, Eyebrow, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { siteConfig } from "../config";
import type { ServiceDetail } from "./service-data";

export function ServicePage({ service }: { service: ServiceDetail }) {
  return (
    <main className="service-page">
      <div className="service-hero-wrap">
        <SiteHeader dark />
        <section className="service-hero">
          <div className="service-breadcrumb"><Link href="/services">Services</Link><span>/</span><b>{service.kicker}</b></div>
          <div className="service-hero-grid">
            <div><Eyebrow light>{service.index} · {service.kicker}</Eyebrow><h1>{service.title}</h1></div>
            <div className="service-hero-copy"><p>{service.intro}</p><Link className="button button-acid" href={`${siteConfig.auditUrl}?service=${service.slug}`}>{service.cta}<span>↗</span></Link><small>No obligation. Start with a practical conversation.</small></div>
          </div>
          <div className="service-promise"><span>THE OUTCOME</span><p>{service.promise}</p><i>{service.index}</i></div>
        </section>
      </div>

      <section className="service-problems">
        <div><Eyebrow>What we solve</Eyebrow><h2>Where the journey tends to break.</h2></div>
        <div className="problem-grid">{service.problems.map((problem, index) => <article key={problem.title}><span>0{index + 1}</span><h3>{problem.title}</h3><p>{problem.text}</p></article>)}</div>
      </section>

      <section className="included-section">
        <div className="included-sticky"><Eyebrow light>What’s included</Eyebrow><h2>A joined-up solution, shaped around what you already have.</h2><p>Scope follows the customer journey—not a one-size-fits-all package.</p></div>
        <ol>{service.inclusions.map((item, index) => <li key={item}><span>0{index + 1}</span><p>{item}</p><i>↗</i></li>)}</ol>
      </section>

      <section className="sector-examples">
        <div className="sector-examples-head"><Eyebrow>In practice</Eyebrow><h2>Made relevant to your world.</h2></div>
        <div className="example-grid">{service.examples.map((example, index) => <article key={example.sector}><span>0{index + 1} / {example.sector}</span><h3>{example.title}</h3><p>{example.text}</p></article>)}</div>
      </section>

      <section className="faq-section">
        <div><Eyebrow>Good questions</Eyebrow><h2>Before we begin.</h2></div>
        <div className="faq-list">{service.faqs.map((faq, index) => <details key={faq.question}><summary><span>0{index + 1}</span>{faq.question}<i>+</i></summary><p>{faq.answer}</p></details>)}</div>
      </section>

      <section className="service-final-cta">
        <Eyebrow light>Your next move</Eyebrow><h2>Make the journey easier to choose.</h2><p>Start with a free audit or a focused discovery call. We’ll identify the most valuable next step.</p><div><Link className="button button-acid" href={`${siteConfig.auditUrl}?service=${service.slug}`}>{service.cta}<span>↗</span></Link><ArrowLink light href={siteConfig.callUrl}>Book a discovery call</ArrowLink></div>
      </section>
      <SiteFooter />
    </main>
  );
}
