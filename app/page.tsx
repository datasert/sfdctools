import { ToolCard } from "@/components/ToolCard";
import { tools } from "@/lib/tools";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function Home() {
  return (
    <div className="h-full overflow-y-auto">
      <SetPageTitle title="&nbsp;" />
      <div className="relative p-4 md:p-6">
        <section className="relative mx-auto mb-6 w-full max-w-6xl overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-[#0b1d3a] via-[#103a6c] to-[#126266] p-6 text-white shadow-[0_20px_70px_rgba(9,23,48,0.25)] md:mb-8 md:p-9">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Salesforce Tools
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-100/95 md:text-base">
            A focused toolbox for Salesforce developers and admins. Format SOQL,
            convert IDs, inspect SLDS assets, diff configs, and run daily
            utility workflows from one place.
          </p>
          <p className="mt-4 text-sm font-semibold text-cyan-100">
            100% free. No trackers. Open source.
          </p>
          <a
            href="https://github.com/datasert/sfdctools"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center text-sm font-medium text-cyan-100 underline decoration-cyan-200/70 underline-offset-4 transition hover:text-white"
          >
            github.com/datasert/sfdctools
          </a>
        </section>

        <section className="mx-auto w-full max-w-6xl">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
              Tool Index
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              {tools.length} tools
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
