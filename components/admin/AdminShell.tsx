"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import siteData from "@/data/site.json";
import { CloseIcon, MenuIcon } from "@/components/ui/Icons";
import BreadcrumbBar from "@/components/layout/BreadcrumbBar";
import BackToTop from "@/components/ui/BackToTop";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/admin/locations", label: "Location Pages" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const { brand } = siteData.navbar;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-pink text-ink">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-navy text-white">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-5">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-white/20 hover:bg-white/10"
            aria-label={open ? "Close sidebar" : "Open sidebar"}
          >
            {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
          <Link href="/admin" className="min-w-0 text-left">
            <span className="block truncate text-lg font-bold leading-none text-white">{brand.name}</span>
            <span className="mt-1 block truncate text-[10px] font-medium text-white/80">{brand.tagline}</span>
          </Link>
          <p className="ml-auto text-sm font-bold tracking-[0.18em] text-white">ADMIN</p>
        </div>
      </header>

      <div className="pt-16">
        <aside
          className={`fixed top-16 bottom-0 z-30 overflow-hidden bg-navy text-white transition-[width] duration-200 ${
            open ? "w-60" : "w-0"
          }`}
        >
          <div className="flex h-full w-60 flex-col">
            <div className="shrink-0 border-b border-white/10 px-5 py-5">
              <p className="text-xs font-semibold tracking-wide text-white/70">Little Angel IVF</p>
              <p className="mt-1 text-lg font-semibold">Content CMS</p>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
              {links.map((link) => {
                const active =
                  link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${
                      active ? "bg-rose text-white" : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="m-3 shrink-0 rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </aside>
        <div className={`min-w-0 flex-1 transition-[margin] duration-200 ${open ? "ml-60" : "ml-0"}`}>
          <BreadcrumbBar />
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <BackToTop />
        </div>
      </div>
    </div>
  );
}
