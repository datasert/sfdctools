"use client";

import { TextDiff } from "./TextDiff";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function TextDiffPage() {
  return (
    <>
      <SetPageTitle title="Text Diff" />
      <TextDiff />
    </>
  );
}
