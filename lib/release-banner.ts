export interface ReleaseBannerConfig {
  version: string;
  title: string;
  description: string;
}

export const CURRENT_RELEASE_BANNER: ReleaseBannerConfig = {
  version: "1.6.0",
  title: "New in v1.6.0",
  description:
    "CSV Editor now includes find and replace, range copy, row and column filtering, custom header actions, and improved mobile navigation branding.",
};
