export interface ReleaseBannerConfig {
  version: string;
  title: string;
  description: string;
}

export const CURRENT_RELEASE_BANNER: ReleaseBannerConfig = {
  version: "1.10.1",
  title: "New in v1.10.1",
  description:
    "Metadata Types has been temporarily removed from navigation while the grid issue is being fixed.",
};
