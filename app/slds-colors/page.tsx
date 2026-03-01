import { SetPageTitle } from "@/components/SetPageTitle";
import { loadSldsStylingHooks } from "@/lib/slds-styling-hooks";
import { SldsColors } from "./SldsColors";

export default function SldsColorsPage() {
  const { hooks } = loadSldsStylingHooks();
  const colorHooks = hooks.filter((hook) => hook.previewType === "Color");

  return (
    <>
      <SetPageTitle title="SLDS Colors" />
      <SldsColors initialColors={colorHooks} />
    </>
  );
}

