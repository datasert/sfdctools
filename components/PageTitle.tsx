"use client";

import { usePathname } from "next/navigation";
import { tools } from "@/lib/tools";
import { useTitle } from "./TitleContext";

export function PageTitle() {
  const pathname = usePathname();
  const { title } = useTitle();
  
  // If title is set via context, use it
  if (title) {
    return (
      <div className="border-b border-[var(--title-border)] bg-[var(--content-color)] px-4 py-2">
        <h1 className="text-base font-bold text-[var(--title-color)]" style={{ fontFamily: 'var(--title-font-family)' }}>
          {title}
        </h1>
      </div>
    );
  }

  // Otherwise, determine title from pathname
  const currentTool = tools.find(
    (tool) => pathname === tool.path || pathname?.startsWith(tool.path)
  );

  // Home page
  if (pathname === "/" || !currentTool) {
    return (
      <div className="border-b border-[var(--title-border)] bg-[var(--content-color)] px-4 py-2">
        <h1 className="text-base font-bold text-[var(--title-color)]" style={{ fontFamily: 'var(--title-font-family)' }}>
          Salesforce Tools
        </h1>
      </div>
    );
  }

  // Tool page - use tool name directly
  return (
    <div className="border-b border-[var(--title-border)] bg-[var(--content-color)] px-4 py-2">
      <h1 className="text-base font-bold text-[var(--title-color)]" style={{ fontFamily: 'var(--title-font-family)' }}>
        {currentTool.name}
      </h1>
    </div>
  );
}
