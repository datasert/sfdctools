"use client";

import { SetPageTitle } from "@/components/SetPageTitle";
import { OmniConfigDiff } from "./OmniConfigDiff";

export default function OmniConfigDiffPage() {
  return (
    <>
      <SetPageTitle title="Omni Config XML Diff" />
      <OmniConfigDiff />
    </>
  );
}
