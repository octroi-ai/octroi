// Plan limits
export const PLAN_LIMITS = {
  free: {
    requestsPerMonth: 10_000,
    providers: 1,
    modules: ["tokenops"],
    cacheEnabled: false,
    supportLevel: "community",
  },
  pro: {
    requestsPerMonth: 500_000,
    providers: 3,
    modules: ["tokenops", "esg", "broker"],
    cacheEnabled: true,
    supportLevel: "email_48h",
  },
  business: {
    requestsPerMonth: 5_000_000,
    providers: -1, // unlimited
    modules: ["tokenops", "esg", "compliance", "broker"],
    cacheEnabled: true,
    supportLevel: "priority_4h",
  },
  enterprise: {
    requestsPerMonth: -1, // unlimited
    providers: -1,
    modules: ["tokenops", "esg", "compliance", "broker"],
    cacheEnabled: true,
    supportLevel: "dedicated_sla",
  },
} as const;

// Supported providers
export const SUPPORTED_PROVIDERS = [
  "openai",
  "anthropic",
  "mistral",
  "google",
  "cohere",
] as const;

// Supported models per provider
export const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o1-mini", "o3-mini"],
  anthropic: ["claude-opus-4-6", "claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
  mistral: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "codestral-latest"],
  google: ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-flash"],
  cohere: ["command-r-plus", "command-r", "command-light"],
};

// Risk levels for EU AI Act
export const RISK_LEVELS = {
  unacceptable: {
    label: "Inacceptable",
    description: "Systèmes interdits par l'EU AI Act",
    color: "#dc2626",
  },
  high: {
    label: "Haut risque",
    description: "Systèmes nécessitant une conformité stricte (Article 6-51)",
    color: "#f59e0b",
  },
  limited: {
    label: "Risque limité",
    description: "Obligations de transparence (Article 52)",
    color: "#3b82f6",
  },
  minimal: {
    label: "Risque minimal",
    description: "Pas d'obligations spécifiques, bonnes pratiques recommandées",
    color: "#22c55e",
  },
} as const;

// Carbon data defaults
export const DEFAULT_PUE = 1.1;
export const DEFAULT_GPU_TDP: Record<string, number> = {
  H100: 700,
  A100: 400,
  B200: 1000,
  L40S: 350,
};

// EU energy grid carbon intensity (gCO2/kWh) by country
export const EU_GRID_CARBON_INTENSITY: Record<string, number> = {
  FR: 56,  // France (nuclear)
  DE: 338, // Germany
  ES: 150, // Spain
  IT: 233, // Italy
  NL: 328, // Netherlands
  SE: 13,  // Sweden
  NO: 17,  // Norway
  PL: 635, // Poland
  BE: 155, // Belgium
  AT: 87,  // Austria
  FI: 71,  // Finland
  DK: 111, // Denmark
  PT: 178, // Portugal
  IE: 296, // Ireland
  DEFAULT: 230,
};

// Cloud region to country mapping
export const CLOUD_REGION_COUNTRY: Record<string, string> = {
  "eu-west-1": "IE",
  "eu-west-2": "GB",
  "eu-west-3": "FR",
  "eu-central-1": "DE",
  "eu-north-1": "SE",
  "eu-south-1": "IT",
  "europe-west1": "BE",
  "europe-west4": "NL",
  "europe-north1": "FI",
  "us-east-1": "US",
  "us-west-2": "US",
};
