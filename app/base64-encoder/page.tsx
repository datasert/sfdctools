"use client";

import { Base64Encoder } from "./Base64Encoder";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function Base64EncoderPage() {
  return (
    <>
      <SetPageTitle title="Base64 Encoder/Decoder" />
      <Base64Encoder />
    </>
  );
}
