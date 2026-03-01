"use client";

import { JwtDecoder } from "./JwtDecoder";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function JwtDecoderPage() {
  return (
    <>
      <SetPageTitle title="JWT Decoder" />
      <JwtDecoder />
    </>
  );
}
