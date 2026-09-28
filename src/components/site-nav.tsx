"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BookOpenCheck, LayoutDashboard, LogOut, Shield, SlidersHorizontal } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function SiteNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const user = session?.user;

  const links = user
    ? [
        { href: "/dashboard", label: "Projects", icon: LayoutDashboard },
        { href: "/settings", label: "Preferences", icon: SlidersHorizontal },
        ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
      <nav className="glass mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5">
        <Link href={user ? "/dashboard" : "/"} className="group flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-white shadow-lg transition-transform duration-300 group-hover:rotate-6">
            <BookOpenCheck size={17} />
          </span>
          <span className="text-lg tracking-tight">Grammaid</span>
        </Link>

        <div className="ml-2 hidden items-center gap-1 sm:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition-all duration-200 ${
                  active ? "bg-white/40 font-medium dark:bg-white/10" : "muted hover:bg-white/25 dark:hover:bg-white/5"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {status === "authenticated" ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm muted md:block">{user?.name ?? user?.email}</span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-ghost"
                aria-label="Sign out"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : status === "unauthenticated" ? (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Get started
              </Link>
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
