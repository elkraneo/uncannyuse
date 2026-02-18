export interface PlatformSupport {
  status: 'y' | 'n' | 'p' | 'h';
  since?: string;
  note?: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  subcategory: string;
  era: string;
  rcp: boolean;
  support: {
    ios: PlatformSupport;
    visionos: PlatformSupport;
    macos: PlatformSupport;
  };
  notes?: string[];
  links?: { text: string; url: string }[];
}

export interface FeatureCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  subcategories: { id: string; name: string; color: string }[];
}

export interface Platform {
  id: string;
  name: string;
  shortName: string;
  color: string;
  versions: string[];
  latestVersion: string;
  note?: string;
}
