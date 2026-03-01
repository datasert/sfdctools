"use client";

import { JsonDiff } from "./JsonDiff";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function JsonDiffPage() {
  return (
    <>
      <SetPageTitle title="JSON Diff" />
      <JsonDiff />
    </>
  );
}
