import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turbo Golf - Classic Edition",
  description: "A vibrant spiritual successor to the 2012 Flash classic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
