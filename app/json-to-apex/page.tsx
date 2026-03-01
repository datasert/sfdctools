"use client";

import { JsonToApex } from "./JsonToApex";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function JsonToApexPage() {
  return (
    <>
      <SetPageTitle title="JSON to Apex" />
      <JsonToApex />
    </>
  );
}
