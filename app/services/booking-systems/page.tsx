import type { Metadata } from "next";
import { ServicePage } from "../ServicePage";
import { services } from "../service-data";
export const metadata: Metadata = { title: "Booking & Lead Systems", description: services["booking-systems"].intro };
export default function Page() { return <ServicePage service={services["booking-systems"]} />; }
