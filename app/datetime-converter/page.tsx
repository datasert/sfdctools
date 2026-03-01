"use client";

import { DateTimeConverter } from "./DateTimeConverter";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function DateTimeConverterPage() {
  return (
    <>
      <SetPageTitle title="DateTime Converter" />
      <DateTimeConverter />
    </>
  );
}
