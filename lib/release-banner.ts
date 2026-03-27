export interface ReleaseBannerConfig {
  version: string;
  title: string;
  description: string;
}

export const CURRENT_RELEASE_BANNER: ReleaseBannerConfig = {
  version: "1.10.0",
  title: "New in v1.10.0",
  description:
    "Metadata Types now browses the Source Deploy Retrieve registry at /metadata-types and adds CSV export for all loaded records.",
};
