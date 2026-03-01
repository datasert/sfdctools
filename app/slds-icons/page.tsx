import { IconPickerClient } from "./IconPickerClient";
import { SetPageTitle } from "@/components/SetPageTitle";
import { loadSldsIconsData } from "@/lib/slds-icons-data";

export default function IconPickerPage() {
  const { icons, categories } = loadSldsIconsData();

  return (
    <>
      <SetPageTitle title="SLDS Icons" />
      <IconPickerClient initialIcons={icons} categories={categories} />
    </>
  );
}
