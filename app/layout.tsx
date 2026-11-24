import type { Metadata } from "next";
import localFont from "next/font/local";
import SiteFrame from "@/components/layout/SiteFrame";
import JsonLd from "@/components/seo/JsonLd";
import RouteSchema from "@/components/seo/RouteSchema";
import { getGlobalSchema } from "@/data/schemaData";
import "./globals.css";

const openSans = localFont({
  src: "./fonts/open-sans-latin.woff2",
  variable: "--font-open-sans",
  weight: "300 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://drmonadahiya.com"),
  title: "Dr. Mona Dahiya | Fertility & IVF Specialist",
  description:
    "Top rated fertility specialist in India. Pioneering IVF centre since 1993 with centres in New Delhi, Lajpat Nagar and Rohini.",
  keywords: [
    "Dr. Mona Dahiya",
    "IVF Specialist Noida",
    "Best IVF Doctor Delhi NCR",
    "Fertility Clinic Noida",
    "IUI Treatment",
    "ICSI Treatment",
    "Little Angel IVF",
  ],
  alternates: {
    canonical: "./",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${openSans.variable} antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if("scrollRestoration" in history)history.scrollRestoration="manual";}catch(e){}`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="flex min-h-screen flex-col font-sans">
        <JsonLd data={getGlobalSchema()} />
        <RouteSchema />
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
