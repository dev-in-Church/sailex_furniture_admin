"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SESSION_EXPIRED_EVENT,
  clearSession,
  getToken,
  getUser,
  hasActiveSession,
} from "@/lib/session";
import type { AdminUser } from "@/types/api";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Categories", href: "/categories", icon: Tag },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

// The "View Store" link only shows when the store's address is configured
const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL;

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const goToLogin = useCallback(
    (expired: boolean) => {
      const params = new URLSearchParams();
      if (expired) params.set("expired", "1");
      if (pathname && pathname !== "/") params.set("next", pathname);
      const query = params.toString();
      router.replace(query ? `/login?${query}` : "/login");
    },
    [router, pathname],
  );

  // Check the session on load and on every navigation
  useEffect(() => {
    if (!hasActiveSession()) {
      const hadToken = Boolean(getToken());
      clearSession();
      goToLogin(hadToken);
      return;
    }
    setAdminUser(getUser());
  }, [goToLogin]);

  // The server rejected the token, or the admin signed out in another tab
  useEffect(() => {
    const onExpired = () => goToLogin(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "adminToken" && !event.newValue) goToLogin(false);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener("storage", onStorage);
    };
  }, [goToLogin]);

  // Knowing the screen size lets the closed mobile menu be skipped by keyboard users
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Close the menu when the page changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // While the mobile menu is open: lock page scroll and let Escape close it
  useEffect(() => {
    if (!sidebarOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  if (!adminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center" role="status">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const currentPage = navigation.find((item) => isActive(pathname, item.href))?.name;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        inert={!isDesktop && !sidebarOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-white transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="font-serif text-lg font-semibold">Admin</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Admin">
            {navigation.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-semibold text-primary">
                  {adminUser.name?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{adminUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {adminUser.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {currentPage && (
            <p className="text-sm font-medium text-foreground lg:hidden">
              {currentPage}
            </p>
          )}

          <div className="flex-1" />

          {STORE_URL && (
            <a
              href={STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              View Store
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </header>

        <main id="main-content" className="flex-1 overflow-x-clip p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
