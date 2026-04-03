export interface ReleaseBannerConfig {
  version: string;
  title: string;
  description: string;
}

export const CURRENT_RELEASE_BANNER: ReleaseBannerConfig = {
  version: "1.9.0",
  title: "New in v1.9.0",
  description:
    "Base64 Zip Viewer is now available with tree browsing, search, resizable panes, and file previews.",
};
