"use client";

import { usePathname } from "next/navigation";
import ScrollToTop from "@/components/layout/ScrollToTop";
import HeaderHeightSync from "@/components/layout/HeaderHeightSync";
import TopBar from "@/components/layout/TopBar";
import Navbar from "@/components/layout/Navbar";
import BreadcrumbBar from "@/components/layout/BreadcrumbBar";
import Footer from "@/components/layout/Footer";
import FloatingActions from "@/components/layout/FloatingActions";

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <div className="min-h-screen bg-pink">{children}</div>;
  }

  return (
    <>
      <ScrollToTop />
      <HeaderHeightSync />
      <div className="site-header sticky top-0 z-[60] w-full shrink-0 border-b-0 bg-navy">
        <TopBar />
        <Navbar />
      </div>
      <BreadcrumbBar />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
      <FloatingActions />
    </>
  );
}
