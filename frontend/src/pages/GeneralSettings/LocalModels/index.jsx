import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isMobile } from "react-device-detect";
import Sidebar from "@/components/SettingsSidebar";
import ProviderCard from "./ProviderCard";
import LocalModels from "@/models/localModels";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Provider configuration with defaults
const PROVIDERS = [
  {
    key: "ollama",
    name: "Ollama",
    description: "Run large language models locally with Ollama",
    baseUrl: "http://localhost:11434",
    logo: null,
  },
  {
    key: "lmstudio",
    name: "LM Studio",
    description: "Discover, download, and run LLMs with LM Studio",
    baseUrl: "http://localhost:1234",
    logo: null,
  },
  {
    key: "localai",
    name: "LocalAI",
    description: "Self-hosted inference engine for local LLM models",
    baseUrl: "http://localhost:8080",
    logo: null,
  },
];

export default function LocalModelsSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    // Initial load
    setLoading(false);

    // Set up periodic refresh of health checks (every 10 seconds)
    const interval = setInterval(() => {
      // Refresh can be triggered by child components
    }, 10000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[86px] md:py-6 py-16">
          {/* Header Section */}
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b-2">
            <div className="items-center">
              <p className="text-lg leading-6 font-bold text-theme-text-primary">
                Local Models
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-theme-text-secondary">
              Configure and manage local language models running on your system.
              Connect to providers like Ollama, LM Studio, or LocalAI to use
              self-hosted models with XSCALE AI.
            </p>
          </div>

          {/* Content Section */}
          {loading ? (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton.default
                  key={i}
                  height={300}
                  highlightColor="var(--theme-bg-primary)"
                  baseColor="var(--theme-bg-secondary)"
                  className="rounded-lg"
                />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PROVIDERS.map((provider) => (
                  <ProviderCard
                    key={provider.key}
                    provider={provider.key}
                    name={provider.name}
                    description={provider.description}
                    logo={provider.logo}
                    baseUrlDefault={provider.baseUrl}
                  />
                ))}
              </div>

              {/* Info Section */}
              <div className="mt-8 p-4 rounded-lg bg-theme-bg-primary bg-opacity-50 border border-theme-sidebar-border">
                <p className="text-xs text-theme-text-secondary">
                  <span className="font-semibold">Tip:</span> Make sure your
                  local model provider is running and accessible at the
                  configured base URL. You can test the connection by clicking
                  the "Test" button in the provider settings.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
