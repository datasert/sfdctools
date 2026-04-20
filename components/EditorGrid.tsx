import { ReactNode } from "react";
import { Splitter } from "./Splitter";

interface EditorGridProps {
  children: ReactNode;
  layout?: "horizontal" | "vertical";
  className?: string;
  resizable?: boolean;
  storageKey?: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
}

export function EditorGrid({
  children,
  layout = "horizontal",
  className = "",
  resizable = true,
  storageKey,
  defaultSize,
  minSize,
  maxSize,
}: EditorGridProps) {
  // If resizable and we have exactly 2 children, use ResizableSplitPane
  if (resizable && Array.isArray(children) && children.length === 2) {
    return (
      <Splitter
        orientation={layout}
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={maxSize}
        storageKey={storageKey}
        className={`p-3 ${className}`}
      >
        {children as [ReactNode, ReactNode]}
      </Splitter>
    );
  }

  // Otherwise, use the original grid layout
  const gridClasses = layout === "horizontal" 
    ? "grid grid-cols-2 gap-3" 
    : "grid grid-rows-2 gap-3";
  
  return (
    <div className={`h-full min-h-0 ${gridClasses} p-3 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
