import paths from "@/utils/paths";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useRedirectToHomeOnOnboardingComplete from "@/hooks/useOnboardingComplete";
import { OnboardingLogoSVG } from "./components/OnboardingLogoSVG";
import SovereigntyBadge, { useDeploymentMode } from "@/components/SovereigntyBadge";
import { useState, useEffect } from "react";

export default function OnboardingHome() {
  const navigate = useNavigate();
  useRedirectToHomeOnOnboardingComplete();
  const { t } = useTranslation();
  const [deploymentMode, setDeploymentMode] = useState("cloud-us");

  useEffect(() => {
    async function detectMode() {
      const detectedMode = await useDeploymentMode();
      setDeploymentMode(detectedMode);
    }
    detectMode();
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-xscale-night light:bg-slate-50">
      {/* Dark mode background gradient */}
      <div
        className="absolute inset-0 light:hidden"
        style={{
          background:
            "radial-gradient(ellipse 160% 100% at 50% 0%, rgba(6, 182, 212, 0.4) 0%, rgba(20, 184, 166, 0.18) 45%, transparent 90%)",
        }}
      />
      {/* Light mode background gradient */}
      <div
        className="absolute inset-0 hidden light:block"
        style={{
          background:
            "radial-gradient(ellipse 160% 100% at 50% 0%, rgba(176, 200, 224, 0.7) 0%, rgba(195, 213, 230, 0.45) 50%, transparent 90%)",
        }}
      />

      {/* Sovereignty Badge - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <SovereigntyBadge mode={deploymentMode} size="sm" showTooltip={true} />
      </div>

      <div className="relative z-10 flex justify-center pt-[58px]">
        <p className="font-display text-white/90 light:text-slate-700 text-3xl font-semibold tracking-[0.12em]">
          XSCALE{" "}
          <span className="text-xscale-cyan-bright light:text-xscale-cyan-deep">
            AI
          </span>
        </p>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-8">
        <div className="absolute flex items-center justify-center w-full px-4 md:px-0 md:max-w-[852px] md:w-[56%]">
          <OnboardingLogoSVG />
        </div>

        <h1 className="relative font-medium text-white light:text-slate-700 text-[64px] md:text-[96px] lg:text-[160px] leading-none tracking-[-0.06em] select-none">
          {t("onboarding.home.welcome")}
        </h1>

        <button
          type="button"
          onClick={() => navigate(paths.onboarding.llmPreference())}
          className="relative border-none z-10 h-[36px] w-[300px] py-2.5 px-5 rounded-lg bg-xscale-brand-gradient hover:opacity-90 font-semibold text-sm mt-[42px] text-white text-center flex justify-center items-center transition-opacity duration-200 shadow-[0_10px_30px_-10px_rgba(6,182,212,0.7)]"
        >
          {t("onboarding.home.getStarted")}
        </button>
      </div>
    </div>
  );
}
