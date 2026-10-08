"use client";
import {
  createContext,
  useContext,
  isValidElement,
  cloneElement,
  type ReactNode,
  type ReactElement,
} from "react";
import { translate, type Language } from "@/lib/i18n";
const LocaleContext = createContext<Language>("en");
export function LocaleProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={language}>{children}</LocaleContext.Provider>
  );
}
export function useLanguage() {
  return useContext(LocaleContext);
}
/** Localize React-owned presentation text. State, identifiers, input values and event handlers remain canonical. */
export function localizeTree(node: ReactNode, language: Language): ReactNode {
  if (Array.isArray(node))
    return node.map((child) => localizeTree(child, language));
  const child = node;
  if (typeof child === "string") {
    const match = child.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    return match[1] + translate(language, match[2]) + match[3];
  }
  if (!isValidElement(child)) return child;
  const element = child as ReactElement<Record<string, unknown>>;
  if (element.props["data-preserve-text"]) return child;
  const props: Record<string, unknown> = {};
  for (const key of ["title", "label", "placeholder", "aria-label", "alt"])
    if (typeof element.props[key] === "string")
      props[key] = translate(language, element.props[key] as string);
  if (
    element.type === "option" &&
    element.props.value === undefined &&
    typeof element.props.children === "string"
  )
    props.value = element.props.children;
  if (element.props.children !== undefined)
    props.children = localizeTree(
      element.props.children as ReactNode,
      language,
    );
  return cloneElement(element, props);
}
export function Localized({ children }: { children: ReactNode }) {
  return <>{localizeTree(children, useLanguage())}</>;
}
