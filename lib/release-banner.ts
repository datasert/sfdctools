export interface ReleaseBannerConfig {
  version: string;
  title: string;
  description: string;
}

export const CURRENT_RELEASE_BANNER: ReleaseBannerConfig = {
  version: "1.8.0",
  title: "New in v1.8.0",
  description:
    "XML Diff is now available with cleanup controls, recursive empty-node removal, and path-based node sorting, and XML Formatter supports the same normalization options.",
};
