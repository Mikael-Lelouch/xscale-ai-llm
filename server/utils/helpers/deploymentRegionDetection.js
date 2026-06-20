/**
 * Deployment Region Detection Utility
 * Detects cloud deployment region and determines if it's EU or US based on provider configuration
 */

/**
 * Azure EU Regions mapping
 */
const AZURE_EU_REGIONS = [
  "westeurope",
  "northeurope",
  "swedencentral",
  "uksouth",
  "francecentral",
  "germanywestcentral",
];

/**
 * AWS Europe Regions mapping
 */
const AWS_EU_REGIONS = [
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-north-1",
];

/**
 * Detect Azure region from endpoint URL
 * @param {string} endpoint - Azure OpenAI endpoint URL
 * @returns {object} {region: string|null, isEU: boolean}
 */
function detectAzureRegion(endpoint) {
  if (!endpoint || typeof endpoint !== "string") {
    return { region: null, isEU: false };
  }

  try {
    // Extract region from URL patterns:
    // https://{resource-name}.openai.azure.com/
    // https://{resource-name}.{region}.inference.ai.azure.com/
    const url = new URL(endpoint);
    const hostname = url.hostname.toLowerCase();

    // Pattern 1: {resource}.{region}.openai.azure.com
    let match = hostname.match(/\.([a-z0-9-]+)\.openai\.azure\.com$/);
    if (match) {
      const region = match[1];
      return {
        region,
        isEU: AZURE_EU_REGIONS.includes(region),
      };
    }

    // Pattern 2: {resource}.{region}.inference.ai.azure.com
    match = hostname.match(/\.([a-z0-9-]+)\.inference\.ai\.azure\.com$/);
    if (match) {
      const region = match[1];
      return {
        region,
        isEU: AZURE_EU_REGIONS.includes(region),
      };
    }

    return { region: null, isEU: false };
  } catch (error) {
    console.error("Error parsing Azure endpoint:", error);
    return { region: null, isEU: false };
  }
}

/**
 * Detect AWS region
 * @param {string} region - AWS region code
 * @returns {object} {region: string|null, isEU: boolean}
 */
function detectAWSRegion(region) {
  if (!region || typeof region !== "string") {
    return { region: null, isEU: false };
  }

  const normalizedRegion = region.toLowerCase().trim();
  return {
    region: normalizedRegion,
    isEU: AWS_EU_REGIONS.includes(normalizedRegion),
  };
}

/**
 * Detect Mistral API deployment (always EU)
 * @param {string} endpoint - Mistral API endpoint
 * @returns {object} {region: string|null, isEU: boolean}
 */
function detectMistralDeployment(endpoint) {
  if (!endpoint || typeof endpoint !== "string") {
    return { region: null, isEU: false };
  }

  try {
    const url = new URL(endpoint);
    const hostname = url.hostname.toLowerCase();

    // Mistral's main API endpoints are in EU
    if (
      hostname === "api.mistral.ai" ||
      hostname === "api.platform.mistral.ai"
    ) {
      return { region: "eu", isEU: true };
    }

    return { region: null, isEU: false };
  } catch (error) {
    console.error("Error parsing Mistral endpoint:", error);
    return { region: null, isEU: false };
  }
}

/**
 * Main deployment detection function
 * @returns {Promise<object>} Deployment mode and region information
 */
async function detectDeploymentMode() {
  const { SystemSettings } = require("../../models/systemSettings");

  try {
    // Get the configured LLM provider
    const llmProvider = await SystemSettings.getValueOrFallback(
      { label: "llm_provider" },
      process.env.LLM_PROVIDER || "openai"
    );

    // Check if it's a local deployment
    const localProviders = [
      "ollama",
      "lmstudio",
      "localai",
      "privatemode",
      "textgenwebui",
    ];
    const isLocal = localProviders.includes(llmProvider.toLowerCase());

    if (isLocal) {
      return {
        mode: "local",
        provider: llmProvider.toLowerCase(),
        region: null,
        isEU: false,
        isCloud: false,
        details: {},
      };
    }

    // Check for cloud EU deployments
    const providerLower = llmProvider.toLowerCase();

    // Azure OpenAI detection
    if (providerLower === "azure" || providerLower.includes("azure")) {
      const azureEndpoint =
        process.env.AZURE_OPENAI_ENDPOINT ||
        (await SystemSettings.getValueOrFallback(
          { label: "azure_openai_endpoint" },
          null
        ));

      if (azureEndpoint) {
        const { region, isEU } = detectAzureRegion(azureEndpoint);
        return {
          mode: isEU ? "cloud-eu" : "cloud-us",
          provider: "azure",
          region: region,
          isEU: isEU,
          isCloud: true,
          details: {
            azureEndpoint: azureEndpoint,
            azureRegion: region,
          },
        };
      }
    }

    // AWS Bedrock detection
    if (providerLower === "aws" || providerLower.includes("bedrock")) {
      const awsRegion =
        process.env.AWS_REGION ||
        process.env.AWS_BEDROCK_REGION ||
        (await SystemSettings.getValueOrFallback(
          { label: "aws_region" },
          null
        ));

      if (awsRegion) {
        const { region, isEU } = detectAWSRegion(awsRegion);
        return {
          mode: isEU ? "cloud-eu" : "cloud-us",
          provider: "aws-bedrock",
          region: region,
          isEU: isEU,
          isCloud: true,
          details: {
            awsRegion: region,
          },
        };
      }
    }

    // Mistral API detection
    if (providerLower === "mistral") {
      const mistralEndpoint =
        process.env.MISTRAL_API_URL ||
        (await SystemSettings.getValueOrFallback(
          { label: "mistral_endpoint" },
          "https://api.mistral.ai"
        ));

      const { region, isEU } = detectMistralDeployment(mistralEndpoint);
      if (isEU) {
        return {
          mode: "cloud-eu",
          provider: "mistral",
          region: region,
          isEU: true,
          isCloud: true,
          details: {
            mistralEndpoint: mistralEndpoint,
          },
        };
      }
    }

    // Default to OpenAI (US-based)
    if (
      providerLower === "openai" ||
      providerLower.includes("openai") ||
      !providerLower
    ) {
      return {
        mode: "cloud-us",
        provider: "openai",
        region: "us-east-1",
        isEU: false,
        isCloud: true,
        details: {
          note: "OpenAI default endpoints are US-based",
        },
      };
    }

    // Unknown provider - default to cloud-us
    return {
      mode: "cloud-us",
      provider: providerLower,
      region: null,
      isEU: false,
      isCloud: true,
      details: {
        note: "Unknown provider, defaulting to cloud-us",
      },
    };
  } catch (error) {
    console.error("Error detecting deployment mode:", error);
    // Default fallback
    return {
      mode: "cloud-us",
      provider: null,
      region: null,
      isEU: false,
      isCloud: true,
      details: {
        error: error.message,
      },
    };
  }
}

module.exports = {
  detectDeploymentMode,
  detectAzureRegion,
  detectAWSRegion,
  detectMistralDeployment,
  AZURE_EU_REGIONS,
  AWS_EU_REGIONS,
};
