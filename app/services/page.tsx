import type { Metadata } from "next";
import { Eyebrow, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { services } from "./service-data";

export const metadata: Metadata = { title: "Hospitality Solutions", description: "Restaurant ordering, websites, practical automation, NFC review systems and local growth for independent hospitality businesses." };

export default function ServicesIndex() {
  const hospitalitySlugs = ["restaurant-automation", "web-design", "nfc-review-cards", "ai-automation", "digital-growth"];
  const serviceList = Object.values(services).filter((service) => hospitalitySlugs.includes(service.slug)).sort((a, b) => a.index.localeCompare(b.index));

  return (
    <main>
      <div className="service-hero-wrap services-index-wrap"><SiteHeader dark /><section className="index-hero"><Eyebrow light>Hospitality business improvement</Eyebrow><h1>Practical solutions.<br /><em>Chosen for the business.</em></h1><p>We recommend a solution only after understanding the customer journey, day-to-day operations and the commercial opportunity.</p></section></div>
      <section className="services-index-grid">{serviceList.map((service) => <a href={`/services/${service.slug}`} key={service.slug}><span>{service.index}</span><div><p>{service.kicker}</p><h2>{service.title}</h2><small>{service.promise}</small></div><i>↗</i></a>)}</section>
      <SiteFooter />
    </main>
  );
}
