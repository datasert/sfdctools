import { ToolCard } from "@/components/ToolCard";
import { tools } from "@/lib/tools";
import { SetPageTitle } from "@/components/SetPageTitle";

export default function Home() {
  return (
    <div className="h-full overflow-y-auto">
      <SetPageTitle title="&nbsp;" />
      <div className="relative p-4 md:p-6">
        <section className="relative mx-auto mb-6 w-full max-w-6xl overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] md:mb-8">
          <div className="h-[3px] bg-[var(--primary-color)]" />
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-4">
              <img
                src="/logos/circlecompass-svgrepo-com.svg"
                alt="Salesforce Tools logo"
                className="h-12 w-12 shrink-0 md:h-14 md:w-14"
              />
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
                Salesforce Tools
              </h1>
            </div>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              A focused toolbox for Salesforce developers and admins, organized
              around practical themes: Salesforce data workflows, SLDS design
              resources, format/transform utilities, comparison tools, and
              day-to-day productivity helpers.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--border-color)] pt-4 text-xs">
              <span className="rounded-full border border-[var(--border-color)] bg-[var(--hover-bg)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                100% Free
              </span>
              <span className="rounded-full border border-[var(--border-color)] bg-[var(--hover-bg)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                100% Local
              </span>
              <span className="rounded-full border border-[var(--border-color)] bg-[var(--hover-bg)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                No trackers
              </span>
              <span className="rounded-full border border-[var(--border-color)] bg-[var(--hover-bg)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                Open source
              </span>
              <span className="rounded-full border border-[var(--border-color)] bg-[var(--hover-bg)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                {tools.length} tools
              </span>
              <a
                href="https://github.com/datasert/sfdctools"
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-xs font-medium text-[var(--primary-color)] underline-offset-4 hover:underline"
              >
                github.com/datasert/sfdctools
              </a>
            </div>
          </div>
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
