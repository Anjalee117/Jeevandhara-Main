import { Localized } from "@/components/localization";
import { cloneElement, useId, type ReactNode, type ReactElement } from "react";
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <Localized>{<span className={`badge ${tone}`}>{children}</span>}</Localized>
  );
}
export function Panel({
  title,
  children,
  label,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <Localized>
      {
        <section className={`panel ${className}`}>
          {title && (
            <div className="panel-heading">
              <h2>{title}</h2>
              {label && <Badge>{label}</Badge>}
            </div>
          )}
          {children}
        </section>
      }
    </Localized>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <Localized>{<p className="empty">{children}</p>}</Localized>;
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <Localized>
      {
        <div className="field">
          <label htmlFor={id}>{label}</label>
          {cloneElement(children as ReactElement<{ id?: string }>, { id })}
        </div>
      }
    </Localized>
  );
}
export function Stat({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon?: ReactNode;
}) {
  return (
    <Localized>
      {
        <div className="stat">
          <div className="stat-label">
            {label}
            {icon}
          </div>
          <strong>{value}</strong>
          <p>{detail}</p>
        </div>
      }
    </Localized>
  );
}
