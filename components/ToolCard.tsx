"use client";

import Link from "next/link";
import { Tool } from "@/lib/tools";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      href={tool.path}
      className="group relative flex rounded-[0.5em] bg-[var(--content-color)] text-[var(--content-text)] p-3 transition-all cursor-pointer"
      style={{
        boxShadow: "0 0 0.625em var(--shadow-color)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 0 0 0.1875em var(--primary-color), 0 0 0.625em var(--shadow-color)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0.625em var(--shadow-color)";
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow =
          "0 0 0 0.1875em var(--primary-color), 0 0 0.625em var(--shadow-color)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0.625em var(--shadow-color)";
      }}
    >
      <div className="flex items-start gap-2.5 w-full">
        {/* Icon */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded text-[var(--text-primary)]">
          {tool.icon ? (
            <img
              src={tool.icon}
              alt={tool.name}
              className="h-9 w-9 object-contain"
            />
          ) : (
            <svg
              className="h-9 w-9"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Title */}
          <h3 className="mb-0.5 text-sm font-semibold leading-tight text-[var(--text-primary)]">
            {tool.name}
          </h3>

          {/* Description */}
          <p className="mb-1.5 text-xs leading-snug text-[var(--text-secondary)] line-clamp-2">
            {tool.description}
          </p>

          {/* Tags */}
          {/*<div className="flex flex-wrap gap-1 mt-auto">*/}
          {/*  {tool.tags.map((tag) => (*/}
          {/*    <span*/}
          {/*      key={tag}*/}
          {/*      className="inline-flex items-center rounded-[0.5em] px-1.5 py-0.5 text-xs font-bold uppercase bg-[var(--faded-color)] text-[var(--content-text)] transition-colors hover:bg-[var(--primary-color)] hover:text-[var(--primary-text)]"*/}
          {/*    >*/}
          {/*      #{tag}*/}
          {/*    </span>*/}
          {/*  ))}*/}
          {/*</div>*/}
        </div>
      </div>
    </Link>
  );
}
