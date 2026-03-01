"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TitleProvider } from "./TitleContext";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <TitleProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
        <Header
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </TitleProvider>
  );
}
