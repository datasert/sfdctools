"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useTitle } from "./TitleContext";
import { tools } from "@/lib/tools";
import { helpContent } from "@/lib/help-content";
import { HelpDialog } from "./HelpDialog";
import packageJson from "@/package.json";
import Link from "next/link";
import { useToast } from "./Toast";
import {
  SHARE_HASH_PARAM,
  clearAllToolState,
  applyToolState,
  decodeToolSharePayloadFromHash,
  encodeToolSharePayload,
  snapshotToolState,
} from "@/lib/share-state";

type HeaderProps = {
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
};

export function Header({
  isMobileSidebarOpen,
  onToggleMobileSidebar,
}: HeaderProps) {
  const uiVersion = `v${packageJson.version}`;
  const pathname = usePathname();
  const { title } = useTitle();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // Determine tool from pathname (for help content)
  const currentTool = tools.find(
    (tool) => pathname === tool.path || pathname?.startsWith(tool.path),
  );
  const toolId = currentTool?.id || null;
  const helpData = toolId ? helpContent[toolId] : null;

  // Determine page title to display (for main content area)
  let pageTitle = "Salesforce Tools";

  if (title) {
    // Use title from context if set
    pageTitle = title;
  } else if (currentTool) {
    // Otherwise, use tool name
    pageTitle = currentTool.name;
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;

    const loadFromHash = async () => {
      try {
        const payload = await decodeToolSharePayloadFromHash(
          window.location.hash,
        );
        if (!payload) return;

        if (
          payload.v !== 1 ||
          !payload.toolId ||
          !payload.path ||
          !payload.state
        ) {
          throw new Error("Invalid shared URL payload.");
        }

        if (window.location.pathname !== payload.path) {
          const targetUrl = `${window.location.origin}${payload.path}#${window.location.hash.slice(1)}`;
          window.location.replace(targetUrl);
          return;
        }

        applyToolState(payload.toolId, payload.state);

        const cleanUrl = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState(null, "", cleanUrl);
        window.location.reload();
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Failed to load shared URL.",
          "error",
        );
      }
    };

    void loadFromHash();
  }, [pathname, showToast]);

  const copyShareLink = async () => {
    if (!currentTool || typeof window === "undefined" || isSharing) return;

    try {
      setIsSharing(true);
      const payload = {
        v: 1 as const,
        toolId: currentTool.id,
        path: currentTool.path,
        state: snapshotToolState(currentTool.id),
      };

      const encoded = await encodeToolSharePayload(payload);
      const hashParams = new URLSearchParams();
      hashParams.set(SHARE_HASH_PARAM, encoded);
      const url = `${window.location.origin}${currentTool.path}#${hashParams.toString()}`;
      let copied = false;

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          copied = true;
        } catch {
          copied = false;
        }
      }

      if (!copied) {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      if (copied) {
        showToast("Share URL copied to clipboard.", "success");
      } else {
        showToast("Copy failed. Clipboard is blocked.", "error");
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to create share URL.",
        "error",
      );
    } finally {
      setIsSharing(false);
    }
  };

  const resetAll = () => {
    if (typeof window === "undefined") return;

    const confirmed = window.confirm(
      "This will clear all saved data, settings, and editor contents across every tool. Continue?",
    );
    if (!confirmed) return;

    const removedKeys = clearAllToolState();
    if (removedKeys === 0) {
      showToast("No saved tool data found.", "warn");
      return;
    }

    window.location.reload();
  };

  return (
    <>
      {ToastComponent}
      <header className="flex h-12 items-center border-b border-[var(--border-color)] bg-[var(--card-bg)]">
        <Link
          href="/"
          className="hidden w-56 border-r border-[var(--border-color)] px-4 hover:bg-[var(--hover-bg)] transition-colors cursor-pointer md:block"
        >
          <div className="flex items-baseline gap-2">
            <h1
              className="text-base font-bold text-[var(--title-color)]"
              style={{ fontFamily: "var(--title-font-family)" }}
            >
              Salesforce Tools
            </h1>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {uiVersion}
            </span>
          </div>
        </Link>

        <div className="flex flex-1 items-center justify-between px-3 md:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="rounded-md p-1 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] md:hidden"
              aria-label={isMobileSidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileSidebarOpen}
              aria-controls="mobile-sidebar"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h2
              className="truncate text-base font-bold text-[var(--title-color)]"
              style={{ fontFamily: "var(--title-font-family)" }}
            >
              {pageTitle}
            </h2>
            {helpData && (
              <button
                onClick={() => setIsHelpOpen(true)}
                className="flex items-center justify-center rounded-md p-1 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                aria-label="Help"
                title="Help"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={resetAll}
              type="button"
              className="rounded-md border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer md:px-2.5"
              aria-label="Reset all"
              title="Reset all saved tool data"
            >
              Reset All
            </button>
            {currentTool && (
              <button
                onClick={copyShareLink}
                type="button"
                className="rounded-md border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer md:px-2.5"
                aria-label="Share"
                title="Copy share URL"
                aria-busy={isSharing}
              >
                {isSharing ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        strokeOpacity="0.25"
                        strokeWidth="2"
                      />
                      <path
                        d="M21 12a9 9 0 00-9-9"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Share
                  </span>
                ) : (
                  "Share"
                )}
              </button>
            )}
            <ThemeSwitcher />
            <a
              href="https://github.com/datasert/sfdctools"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label="GitHub"
            >
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

        {helpData && (
          <HelpDialog
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
            title={helpData.title}
          >
            {helpData.content}
          </HelpDialog>
        )}
      </header>
    </>
  );
}
