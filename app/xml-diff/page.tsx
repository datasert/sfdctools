"use client";

import { XmlDiff } from "./XmlDiff";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function XmlDiffPage() {
  return (
    <>
      <SetPageTitle title="XML Diff" />
      <XmlDiff />
    </>
  );
}
