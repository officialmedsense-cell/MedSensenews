import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedSense Dashboard | Premium Medical Intelligence",
  description: "Advanced medical intelligence and data telemetry dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
