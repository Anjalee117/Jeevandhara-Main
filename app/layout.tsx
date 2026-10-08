import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Jeevandhara — Farm intelligence",
  description:
    "Voice-first agricultural decision and action platform. Interactive demo.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
