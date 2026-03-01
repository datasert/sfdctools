"use client";

import { UrlEncoder } from "./UrlEncoder";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function UrlEncoderPage() {
  return (
    <>
      <SetPageTitle title="URL Encoder/Decoder" />
      <UrlEncoder />
    </>
  );
}
