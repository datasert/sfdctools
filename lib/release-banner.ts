export interface ReleaseBannerConfig {
  version: string;
  title: string;
  description: string;
}

export const CURRENT_RELEASE_BANNER: ReleaseBannerConfig = {
  version: "1.10.1",
  title: "New in v1.10.0",
  description:
    "New SF CLI Reference tool — browse and search Salesforce CLI commands by category, build commands interactively with a flag builder, and copy the generated output.",
};
