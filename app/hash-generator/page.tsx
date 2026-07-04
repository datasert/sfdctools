import { SetPageTitle } from "@/components/SetPageTitle";
import { HashGenerator } from "./HashGenerator";

export default function HashGeneratorPage() {
  return (
    <>
      <SetPageTitle title="Hash Generator" />
      <HashGenerator />
    </>
  );
}
