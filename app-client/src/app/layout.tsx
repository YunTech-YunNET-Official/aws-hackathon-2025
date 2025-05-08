import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "電話銷售互動平台",
  description: "電話銷售互動平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}