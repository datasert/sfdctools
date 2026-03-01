"use client";

import { ReactNode } from "react";
import { Splitter } from "./Splitter";

interface ResizableSplitPaneProps {
  children: [ReactNode, ReactNode];
  layout?: "horizontal" | "vertical";
  defaultSize?: number; // Percentage (0-100)
  minSize?: number; // Percentage (0-100)
  maxSize?: number; // Percentage (0-100)
  storageKey?: string; // For persisting split position
  className?: string;
}

export function ResizableSplitPane({
  children,
  layout = "horizontal",
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  storageKey,
  className = "",
}: ResizableSplitPaneProps) {
  return (
    <Splitter
      orientation={layout}
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      storageKey={storageKey}
      className={`p-3 ${className}`}
    >
      {children}
    </Splitter>
  );
}
