"use client";

import { useState, useMemo } from "react";
import { IconCard } from "./IconCard";
import type { IconInfo } from "@/lib/icon-utils";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";

interface IconPickerClientProps {
  initialIcons: IconInfo[];
  categories: string[];
}

const INITIAL_LOAD_COUNT = 100;
const ICON_SIZES = {
  "xx-small": "w-3 h-3",
  "x-small": "w-4 h-4",
  small: "w-5 h-5",
  medium: "w-6 h-6",
  large: "w-8 h-8",
} as const;

type IconSize = keyof typeof ICON_SIZES;
const ICON_VARIANTS = ["default", "inverse", "success", "error", "warning"] as const;
type IconVariant = (typeof ICON_VARIANTS)[number];

const STORAGE_KEY = "sfdc-tools:slds-icons";

export function IconPickerClient({ initialIcons, categories }: IconPickerClientProps) {
  const [searchQuery, setSearchQuery] = usePersistedState<string>(`${STORAGE_KEY}:searchQuery`, "");
  const [selectedCategory, setSelectedCategory] = usePersistedState<string>(`${STORAGE_KEY}:selectedCategory`, "all");
  const [iconSize, setIconSize] = usePersistedState<IconSize>(`${STORAGE_KEY}:iconSize`, "medium");
  const [iconVariant, setIconVariant] = usePersistedState<IconVariant>(`${STORAGE_KEY}:iconVariant`, "default");
  const [showAll, setShowAll] = usePersistedState<boolean>(`${STORAGE_KEY}:showAll`, false);
  const { showToast, ToastComponent } = useToast();

  const filteredIcons = useMemo(() => {
    let filtered = initialIcons;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(icon => icon.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        icon =>
          icon.name.toLowerCase().includes(query) ||
          icon.category.toLowerCase().includes(query) ||
          `${icon.category}:${icon.name}`.toLowerCase().includes(query) ||
          (icon.aliases || []).some((alias) => alias.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [initialIcons, selectedCategory, searchQuery]);

  const displayedIcons = showAll
    ? filteredIcons
    : filteredIcons.slice(0, INITIAL_LOAD_COUNT);

  const hasMore = filteredIcons.length > INITIAL_LOAD_COUNT && !showAll;

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
      {/* Filters */}
      <div className="border-b border-[var(--border-color)] bg-[var(--card-bg)] p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="min-w-[140px]"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </Select>

          {/* Search */}
          <Input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[180px]"
          />

          {/* Size Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Size:</span>
            <Select
              value={iconSize}
              onChange={(e) => setIconSize(e.target.value as IconSize)}
              className="min-w-[100px]"
            >
              {Object.keys(ICON_SIZES).map((size) => (
                <option key={size} value={size}>
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {/* Variant Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Variant:</span>
            <Select
              value={iconVariant}
              onChange={(e) => setIconVariant(e.target.value as IconVariant)}
              className="min-w-[110px]"
            >
              {ICON_VARIANTS.map((variant) => (
                <option key={variant} value={variant}>
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {/* Results count */}
          <div className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
            {filteredIcons.length} icon{filteredIcons.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Icon Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {displayedIcons.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
            No icons found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
              {displayedIcons.map((icon) => (
                <IconCard
                  key={`${icon.category}:${icon.name}`}
                  icon={icon}
                  size={iconSize}
                  variant={iconVariant}
                  onCopy={showToast}
                />
              ))}
            </div>
            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button onClick={() => setShowAll(true)} size="sm">
                  Load All Icons ({filteredIcons.length - INITIAL_LOAD_COUNT} more)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
