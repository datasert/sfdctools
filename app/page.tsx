import { ToolCard } from "@/components/ToolCard";
import { tools } from "@/lib/tools";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function Home() {
  return (
    <div className="h-full overflow-y-auto">
      <SetPageTitle title=" " />
      <div className="p-4">
        {/* Section Header */}
        {/* Tools Grid */}
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
