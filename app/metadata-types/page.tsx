"use client";

import { SetPageTitle } from "@/components/SetPageTitle";
import { MetadataRegistryBrowser } from "./MetadataRegistryBrowser";

export default function MetadataRegistryPage() {
  return (
    <>
      <SetPageTitle title="Metadata Types" />
      <MetadataRegistryBrowser />
    </>
  );
}
