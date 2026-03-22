"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools } from "@/lib/tools";

type SidebarProps = {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tools;
    return tools.filter((tool) => {
      return (
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [search]);

  const closeIfMobile = () => {
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      <aside className="hidden h-full min-h-0 w-56 flex-col overflow-hidden border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] md:flex">
        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tools..."
              className="w-full rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2.5 py-1.5 text-sm text-[var(--input-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-[var(--input-background)] transition-colors"
            />
          </div>
          <ul className="space-y-0.5">
            {filteredTools.map((tool) => {
              const isActive = pathname === tool.path || pathname?.startsWith(tool.path);
              return (
                <li key={tool.id}>
                  <Link
                    href={tool.path}
                    onClick={closeIfMobile}
                    className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[var(--hover-bg)] font-medium text-[var(--text-primary)]"
                        : "text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                    }`}
                  >
                    {tool.name}
                  </Link>
                </li>
              );
            })}
            {filteredTools.length === 0 && (
              <li className="px-2.5 py-2 text-xs text-[var(--text-tertiary)]">
                No tools found
              </li>
            )}
          </ul>
        </nav>
        <div className="border-t border-[var(--sidebar-border)] p-3 space-y-2">
          <Link
            href="/change-log"
            onClick={closeIfMobile}
            className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors cursor-pointer ${
              pathname === "/change-log"
                ? "bg-[var(--hover-bg)] font-medium text-[var(--text-primary)]"
                : "text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
            }`}
          >
            Change Log
          </Link>
          <Link
            href="/about"
            onClick={closeIfMobile}
            className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors cursor-pointer ${
              pathname === "/about"
                ? "bg-[var(--hover-bg)] font-medium text-[var(--text-primary)]"
                : "text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
            }`}
          >
            About
          </Link>
          <p className="text-xs text-[var(--text-secondary)]">
            Built with <span className="text-red-500">❤️</span> by{" "}
            <a
              href="https://www.datasert.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-color)] transition-colors cursor-pointer"
            >
              Datasert
            </a>
          </p>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] shadow-xl transition-transform duration-200 ease-out md:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-[var(--sidebar-border)] px-3">
          <div className="flex items-center gap-2">
            <Link href="/" onClick={closeIfMobile} className="flex items-center">
              <img
                src="/logos/circlecompass-svgrepo-com.svg"
                alt="Salesforce Tools logo"
                className="h-6 w-6 shrink-0"
              />
            </Link>
            <a
              href="https://www.datasert.com/products/brobench"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <img
                src="/logos/brobench-logo.svg"
                alt="Brobench logo"
                className="h-6 w-6 shrink-0"
              />
            </a>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tools..."
              className="w-full rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2.5 py-1.5 text-sm text-[var(--input-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-[var(--input-background)] transition-colors"
            />
          </div>
          <ul className="space-y-0.5">
            {filteredTools.map((tool) => {
              const isActive = pathname === tool.path || pathname?.startsWith(tool.path);
              return (
                <li key={tool.id}>
                  <Link
                    href={tool.path}
                    onClick={closeIfMobile}
                    className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[var(--hover-bg)] font-medium text-[var(--text-primary)]"
                        : "text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                    }`}
                  >
                    {tool.name}
                  </Link>
                </li>
              );
            })}
            {filteredTools.length === 0 && (
              <li className="px-2.5 py-2 text-xs text-[var(--text-tertiary)]">
                No tools found
              </li>
            )}
          </ul>
        </nav>

        <div className="border-t border-[var(--sidebar-border)] p-3 space-y-2">
          <Link
            href="/change-log"
            onClick={closeIfMobile}
            className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors cursor-pointer ${
              pathname === "/change-log"
                ? "bg-[var(--hover-bg)] font-medium text-[var(--text-primary)]"
                : "text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
            }`}
          >
            Change Log
          </Link>
          <Link
            href="/about"
            onClick={closeIfMobile}
            className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors cursor-pointer ${
              pathname === "/about"
                ? "bg-[var(--hover-bg)] font-medium text-[var(--text-primary)]"
                : "text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
            }`}
          >
            About
          </Link>
          <p className="text-xs text-[var(--text-secondary)]">
            Built with <span className="text-red-500">❤️</span> by{" "}
            <a
              href="https://www.datasert.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-color)] transition-colors cursor-pointer"
            >
              Datasert
            </a>
          </p>
        </div>
      </aside>
    </>
  );
}
