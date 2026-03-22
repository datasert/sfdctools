"use client";

import { SetPageTitle } from "@/components/SetPageTitle";
import { CsvEditor } from "./CsvEditor";

export default function CsvEditorPage() {
  return (
    <>
      <SetPageTitle title="CSV Editor" />
      <CsvEditor />
    </>
  );
}

