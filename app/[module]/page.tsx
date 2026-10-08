import { notFound } from "next/navigation";
import { Application } from "@/components/application";
const modules = [
  "dashboard",
  "voice",
  "farm",
  "context",
  "schemes",
  "crop-health",
  "market",
  "weather",
  "threats",
  "actions",
  "knowledge",
  "notifications",
  "settings",
  "system",
];
export function generateStaticParams() {
  return modules.map((module) => ({ module }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (!modules.includes(module)) notFound();
  return <Application module={module} />;
}
