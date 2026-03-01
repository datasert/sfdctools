"use client";

import { HtmlFormatter } from "./HtmlFormatter";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function HtmlFormatterPage() {
  return (
    <>
      <SetPageTitle title="HTML Formatter" />
      <HtmlFormatter />
    </>
  );
}
