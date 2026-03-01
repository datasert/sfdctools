"use client";

import { JsonFormatter } from "./JsonFormatter";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function JsonFormatterPage() {
  return (
    <>
      <SetPageTitle title="JSON Formatter" />
      <JsonFormatter />
    </>
  );
}
