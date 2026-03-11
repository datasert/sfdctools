import { TextProcessor } from "./TextProcessor";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function TextProcessorPage() {
  return (
    <>
      <SetPageTitle title="Text Tool" />
      <TextProcessor />
    </>
  );
}
