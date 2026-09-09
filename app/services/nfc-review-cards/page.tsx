import type { Metadata } from "next";
import { ServicePage } from "../ServicePage";
import { services } from "../service-data";

export const metadata: Metadata = {
  title: "NFC Review Cards & Setup",
  description: services["nfc-review-cards"].intro,
};

export default function Page() {
  return <ServicePage service={services["nfc-review-cards"]} />;
}
