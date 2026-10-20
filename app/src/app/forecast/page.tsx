import { redirect } from "next/navigation";

// Ancien écran "Prévisions de trésorerie" : intégré au Pilotage.
export default function ForecastRedirect() {
  redirect("/dashboard");
}
