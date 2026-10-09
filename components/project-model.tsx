import { Localized } from "@/components/localization";
export function ProjectModel({
  kind,
}: {
  kind: "disease" | "threat" | "schemes";
}) {
  const descriptions = {
    disease:
      "Your disease detection model will provide the diagnosis, confidence and recommended action here. Current results are sample outputs.",
    threat:
      "Your threat detection model will provide detected activity, severity and alerts here. Current sensor readings and events are simulated.",
    schemes:
      "Your government schemes model will provide matching schemes, eligibility and supporting sources here. Current scheme data is a sample catalog.",
  };
  return (
    <Localized>
      <p className="project-model-note">{descriptions[kind]}</p>
    </Localized>
  );
}
