import { SoqlFormatter } from "./SoqlFormatter";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function SoqlFormatterPage() {
  return (
    <>
      <SetPageTitle title="SOQL Formatter" />
      <SoqlFormatter />
    </>
  );
}
