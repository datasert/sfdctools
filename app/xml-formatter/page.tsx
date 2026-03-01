"use client";

import { XmlFormatter } from "./XmlFormatter";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function XmlFormatterPage() {
  return (
    <>
      <SetPageTitle title="XML Formatter" />
      <XmlFormatter />
    </>
  );
}
