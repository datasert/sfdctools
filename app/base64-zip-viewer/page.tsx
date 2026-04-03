"use client";

import { SetPageTitle } from "@/components/SetPageTitle";
import { Base64ZipViewer } from "./Base64ZipViewer";

export default function Base64ZipViewerPage() {
  return (
    <>
      <SetPageTitle title="Base64 Zip Viewer" />
      <Base64ZipViewer />
    </>
  );
}
