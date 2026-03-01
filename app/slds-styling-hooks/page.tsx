import { SetPageTitle } from "@/components/SetPageTitle";
import { loadSldsStylingHooks } from "@/lib/slds-styling-hooks";
import { SldsStylingHooks } from "./SldsStylingHooks";

export default function SldsStylingHooksPage() {
  const { hooks, availableTypes } = loadSldsStylingHooks();

  return (
    <>
      <SetPageTitle title="SLDS Styling Hooks" />
      <SldsStylingHooks initialHooks={hooks} availableTypes={availableTypes} />
    </>
  );
}
