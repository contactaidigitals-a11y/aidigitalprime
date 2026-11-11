import { redirect } from "next/navigation";

// Fallback if a hosting adapter does not apply the homepage rewrite.
// The canonical landing page lives at /prime/index.html.
export default function Home() {
  redirect("/prime/index.html");
}
