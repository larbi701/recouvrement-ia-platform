import { redirect } from "next/navigation";

// Ancien écran "Interventions humaines" : la file de l'équipe est dans le Centre d'action,
// les indicateurs IA / humain dans le Pilotage.
export default function TeamRedirect() {
  redirect("/cockpit");
}
