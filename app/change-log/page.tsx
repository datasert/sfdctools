"use client";

import { SetPageTitle } from "@/components/SetPageTitle";

type ChangeLogItem = {
  date: string;
  title: string;
};

const CHANGE_LOG_ITEMS: ChangeLogItem[] = [
  { date: "2026-03-18", title: "Add syntax selector to Text Diff with Monaco language support" },
  { date: "2026-03-11", title: "Refresh app branding with new logo favicon and header treatment" },
  { date: "2026-03-11", title: "Add logo to About page and increase About and Help text size" },
  { date: "2026-03-11", title: "Add Copy Diffs action to Text Diff clipboard tools" },
  { date: "2026-03-09", title: "Add global Reset All action to clear saved tool data" },
  { date: "2026-03-09", title: "Add sample input loader for input-based tools" },
  { date: "2026-02-26", title: "Add ability to sort text in Text Diff" },
  { date: "2026-02-23", title: "Adjust mobile layout" },
  { date: "2026-02-23", title: "Add SLDS related tools" },
  { date: "2026-02-20", title: "Update Text Tool features" },
  { date: "2026-02-20", title: "Update text operations" },
  { date: "2026-02-20", title: "Update diff editor and text tool" },
  { date: "2026-02-19", title: "Fix issues with diff editor" },
  { date: "2026-02-19", title: "Add json diff tool" },
  { date: "2026-02-19", title: "Add common diff editor and share config" },
  { date: "2026-01-16", title: "Add more tools" },
  { date: "2026-01-16", title: "Add json to apex" },
  { date: "2026-01-16", title: "Add about page" },
  { date: "2026-01-16", title: "Add Json and Xml formatter" },
  { date: "2026-01-16", title: "Add Datetime Converter" },
  { date: "2026-01-16", title: "First version" },
  { date: "2026-01-15", title: "Initial commit" },
];

const groupedByDate = CHANGE_LOG_ITEMS.reduce<Record<string, ChangeLogItem[]>>((acc, item) => {
  if (!acc[item.date]) {
    acc[item.date] = [];
  }
  acc[item.date].push(item);
  return acc;
}, {});

export default function ChangeLogPage() {
  const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <SetPageTitle title="Change Log" />
      <div className="mx-auto max-w-4xl p-6">
        <div className="space-y-6">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Change Log</h1>
          </div>

          <div className="space-y-5">
            {dates.map((date) => (
              <section key={date} className="rounded-md border border-[var(--content-border)] bg-[var(--content-color)] p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  {date}
                </h2>
                <ul className="space-y-2">
                  {groupedByDate[date].map((item, index) => (
                    <li key={`${item.date}-${item.title}-${index}`} className="text-sm text-[var(--text-primary)]">
                      {item.title}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
