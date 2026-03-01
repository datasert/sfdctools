import { SetPageTitle } from "@/components/SetPageTitle";
import { loadSldsCssClasses } from "@/lib/slds-css-classes";
import { SldsCssClasses } from "./SldsCssClasses";

export default function SldsCssClassesPage() {
  const { classes, utilities, previewTypes } = loadSldsCssClasses();

  return (
    <>
      <SetPageTitle title="SLDS CSS Classes" />
      <SldsCssClasses
        initialClasses={classes}
        utilities={utilities}
        previewTypes={previewTypes}
      />
    </>
  );
}
