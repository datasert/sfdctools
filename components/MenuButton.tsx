"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

interface MenuButtonProps {
  label: string;
  children: ReactNode;
}

export function MenuButton({ label, children }: MenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updateMenuPosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    updateMenuPosition();
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        ref={buttonRef}
        type="button"
        size="sm"
        onClick={() => setIsOpen((current) => !current)}
        className="font-mono"
      >
        {label}
      </Button>

      {isOpen && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[1000] min-w-56 rounded-md border border-[var(--content-border)] bg-[var(--content-color)] p-1 shadow-lg"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div onClick={() => setIsOpen(false)}>{children}</div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
