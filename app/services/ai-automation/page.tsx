import type { Metadata } from "next";
import { ServicePage } from "../ServicePage";
import { services } from "../service-data";
export const metadata: Metadata = { title: "AI Automation", description: services["ai-automation"].intro };
export default function Page() { return <ServicePage service={services["ai-automation"]} />; }
