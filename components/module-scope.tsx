import { Localized } from "@/components/localization";
import { moduleScope } from "@/data/module-scope";

export function ModuleScope({ module }: { module: string }) {
  const scope = moduleScope[module];
  if (!scope) return null;
  return (
    <Localized>
      <details className="module-scope">
        <summary>Future scope</summary>
        <dl>
          <div>
            <dt>Available now</dt>
            <dd>{scope.now}</dd>
          </div>
          <div>
            <dt>Planned integration</dt>
            <dd>{scope.later}</dd>
          </div>
        </dl>
      </details>
    </Localized>
  );
}
