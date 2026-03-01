"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import { CurrentTimeCard } from "./CurrentTimeCard";
import { EditableDateTimeCard } from "./EditableDateTimeCard";
import { getDateTimeFormats, getBrowserTimezone, InputType, dateToDatetimeLocal } from "./datetime-utils";

const STORAGE_KEY = "sfdc-tools:datetime-converter";

interface CardConfig {
  id: string;
  inputType: InputType;
  inputValue: string;
  timezone: string;
  trackCurrentTime: boolean;
}

function getDefaultCards(): CardConfig[] {
  const browserTimezone = getBrowserTimezone();
  const now = new Date();
  const formats = getDateTimeFormats(now, browserTimezone);

  return [
    {
      id: "card-0-current",
      inputType: "current",
      inputValue: "",
      timezone: browserTimezone,
      trackCurrentTime: true,
    },
    {
      id: "card-1-iso-utc",
      inputType: "iso-utc",
      inputValue: formats.isoUtc,
      timezone: browserTimezone,
      trackCurrentTime: false,
    },
    {
      id: "card-2-iso-user",
      inputType: "iso-user",
      inputValue: formats.isoUser,
      timezone: browserTimezone,
      trackCurrentTime: false,
    },
    {
      id: "card-3-datetime-user",
      inputType: "datetime-user",
      inputValue: dateToDatetimeLocal(now, browserTimezone),
      timezone: browserTimezone,
      trackCurrentTime: false,
    },
    {
      id: "card-4-datetime-utc",
      inputType: "datetime-utc",
      inputValue: dateToDatetimeLocal(now, "UTC"),
      timezone: browserTimezone,
      trackCurrentTime: false,
    },
    {
      id: "card-5-unix-seconds",
      inputType: "unix-seconds",
      inputValue: String(formats.unixSeconds),
      timezone: browserTimezone,
      trackCurrentTime: false,
    },
  ];
}

// Memoize default cards to avoid recalculating on every render
const defaultCardsMemo = getDefaultCards();

export function DateTimeConverter() {
  const [cardConfigs, setCardConfigs] = usePersistedState<CardConfig[]>(
    `${STORAGE_KEY}:cards`,
    defaultCardsMemo
  );
  const { showToast, ToastComponent } = useToast();

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    showToast("Copied to clipboard!");
  };

  const handleAddCard = () => {
    const browserTimezone = getBrowserTimezone();
    const now = new Date();
    
    // Get all input types currently in use
    const usedInputTypes = new Set(cardConfigs.map(card => card.inputType));
    
    // Available input types in order of preference
    const availableInputTypes: InputType[] = [
      "current",
      "unix-seconds",
      "unix-milliseconds",
      "iso-utc",
      "iso-user",
      "datetime-user",
      "datetime-utc",
    ];
    
    // Find the first input type that's not already used
    const newInputType = availableInputTypes.find(type => !usedInputTypes.has(type)) || "current";
    
    // Set initial value based on input type
    let initialValue = "";
    if (newInputType === "iso-utc") {
      initialValue = getDateTimeFormats(now, browserTimezone).isoUtc;
    } else if (newInputType === "iso-user") {
      initialValue = getDateTimeFormats(now, browserTimezone).isoUser;
    } else if (newInputType === "datetime-user") {
      initialValue = dateToDatetimeLocal(now, browserTimezone);
    } else if (newInputType === "datetime-utc") {
      initialValue = dateToDatetimeLocal(now, "UTC");
    } else if (newInputType === "unix-seconds") {
      initialValue = String(Math.floor(now.getTime() / 1000));
    } else if (newInputType === "unix-milliseconds") {
      initialValue = String(now.getTime());
    }
    
    const newCard: CardConfig = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      inputType: newInputType,
      inputValue: initialValue,
      timezone: browserTimezone,
      trackCurrentTime: false,
    };
    setCardConfigs([...cardConfigs, newCard]);
  };

  const handleRemoveCard = (id: string) => {
    setCardConfigs(cardConfigs.filter((card) => card.id !== id));
  };

  const handleCardChange = (id: string, updates: { inputType?: InputType; inputValue?: string; timezone?: string }) => {
    setCardConfigs(
      cardConfigs.map((card) =>
        card.id === id ? { ...card, ...updates } : card
      )
    );
  };

  return (
    <>
      {ToastComponent}
      <div className="p-6">
        <CurrentTimeCard onCopy={handleCopy} />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-secondary)]">Custom Date/Time Cards</h3>
          <Button onClick={handleAddCard} variant="primary" size="sm">
            Add Card
          </Button>
        </div>

        {cardConfigs.length === 0 ? (
          <div className="text-sm text-[var(--text-tertiary)] text-center py-8">
            No cards yet. Click "Add Card" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cardConfigs.map((card) => (
              <EditableDateTimeCard
                key={card.id}
                id={card.id}
                onRemove={handleRemoveCard}
                onCopy={handleCopy}
                initialInputType={card.inputType}
                initialInputValue={card.inputValue}
                initialTimezone={card.timezone}
                trackCurrentTime={card.trackCurrentTime}
                onChange={handleCardChange}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
