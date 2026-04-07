export interface ReleaseBannerConfig {
  version: string;
  title: string;
  description: string;
}

export const CURRENT_RELEASE_BANNER: ReleaseBannerConfig = {
  version: "1.9.1",
  title: "New in v1.9.1",
  description:
    "Text Diff now includes text cleanup controls, and Base64 ZIP Viewer adds sample loading plus better content-aware previews.",
};
