"use client";

import { DeviceInformation } from "./DeviceInformation";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function DeviceInformationPage() {
  return (
    <>
      <SetPageTitle title="Device Information" />
      <DeviceInformation />
    </>
  );
}
