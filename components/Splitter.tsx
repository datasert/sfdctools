"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { usePersistedState } from "@/lib/use-persisted-state";

interface SplitterProps {
  children: [ReactNode, ReactNode];
  orientation?: "horizontal" | "vertical";
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  storageKey?: string;
  className?: string;
}

export function Splitter({
  children,
  orientation = "horizontal",
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  storageKey,
  className = "",
}: SplitterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = usePersistedState<number>(
    storageKey || `splitter-${orientation}`,
    defaultSize
  );

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newSize: number;
      if (orientation === "horizontal") {
        const x = event.clientX - rect.left;
        newSize = (x / rect.width) * 100;
      } else {
        const y = event.clientY - rect.top;
        newSize = (y / rect.height) * 100;
      }

      setSize(Math.max(minSize, Math.min(maxSize, newSize)));
    },
    [isDragging, maxSize, minSize, orientation, setSize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = orientation === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [handleMouseMove, handleMouseUp, isDragging, orientation]);

  const dividerStyle =
    orientation === "horizontal"
      ? {
          width: "4px",
          cursor: "col-resize",
          backgroundColor: isDragging ? "var(--primary-color)" : "var(--border-color)",
        }
      : {
          height: "4px",
          cursor: "row-resize",
          backgroundColor: isDragging ? "var(--primary-color)" : "var(--border-color)",
        };

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex overflow-hidden ${orientation === "horizontal" ? "flex-row" : "flex-col"} ${className}`}
    >
      <div
        className="overflow-hidden"
        style={
          orientation === "horizontal"
            ? {
                flex: `0 0 ${size}%`,
                minWidth: `${minSize}%`,
                maxWidth: `${maxSize}%`,
              }
            : {
                flex: `0 0 ${size}%`,
                minHeight: `${minSize}%`,
                maxHeight: `${maxSize}%`,
              }
        }
      >
        {children[0]}
      </div>

      <div
        className={`flex-shrink-0 flex items-center justify-center hover:bg-[var(--hover-bg)] transition-colors group ${
          orientation === "horizontal" ? "mx-1.5" : "my-1.5"
        }`}
        style={dividerStyle}
        onMouseDown={handleMouseDown}
      >
        <div
          className={
            orientation === "horizontal"
              ? "w-0.5 h-8 bg-[var(--border-color)] group-hover:bg-[var(--primary-color)] transition-colors"
              : "h-0.5 w-8 bg-[var(--border-color)] group-hover:bg-[var(--primary-color)] transition-colors"
          }
        />
      </div>

      <div
        className="overflow-hidden flex-1"
        style={
          orientation === "horizontal"
            ? {
                minWidth: `${100 - maxSize}%`,
                maxWidth: `${100 - minSize}%`,
              }
            : {
                minHeight: `${100 - maxSize}%`,
                maxHeight: `${100 - minSize}%`,
              }
        }
      >
        {children[1]}
      </div>
    </div>
  );
}
