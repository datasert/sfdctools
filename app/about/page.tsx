"use client";

import { SetPageTitle } from "@/components/SetPageTitle";

export default function AboutPage() {
  return (
    <>
      <SetPageTitle title="About" />
      <div className="p-6 max-w-3xl mx-auto">
        <div className="space-y-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img
                src="/logos/circlecompass-svgrepo-com.svg"
                alt="Salesforce Tools logo"
                className="h-8 w-8 shrink-0"
              />
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                About Salesforce Tools
              </h1>
            </div>
            <p className="text-lg leading-relaxed text-[var(--text-secondary)]">
              Salesforce Tools is a collection of developer utilities designed
              to make working with Salesforce data and code easier and more
              efficient.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-2xl font-semibold text-[var(--text-primary)]">
              Privacy & Security
            </h2>
            <div className="space-y-4 text-base text-[var(--text-secondary)]">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-lg font-medium text-[var(--text-primary)]">
                    100% Secure with Local Processing
                  </p>
                  <p>
                    All processing happens entirely on your device. Your data
                    never leaves your browser or computer. We will not add any
                    tools/features that would send data to internet or pull data
                    from internet.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-lg font-medium text-[var(--text-primary)]">
                    No Data Transmission
                  </p>
                  <p>
                    No data is sent to any external servers. All operations are
                    performed locally in your browser using client-side
                    JavaScript.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-lg font-medium text-[var(--text-primary)]">
                    No Tracking
                  </p>
                  <p>This application is completely tracker-free</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-2xl font-semibold text-[var(--text-primary)]">
              Data Storage
            </h2>
            <p className="text-base leading-relaxed text-[var(--text-secondary)]">
              Some tools may store your preferences and input data locally in
              your browser's localStorage for convenience. This data remains on
              your device and is never transmitted anywhere. You can clear this
              data at any time through your browser's settings.
            </p>
          </div>

          <div className="border-t border-[var(--content-border)] pt-4">
            <p className="text-base text-[var(--text-secondary)]">
              Built with <span className="text-red-500">❤️</span> by{" "}
              <a
                href="https://www.datasert.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-color)] transition-colors cursor-pointer"
              >
                Datasert
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
