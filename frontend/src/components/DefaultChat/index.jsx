import React, { useEffect, useState } from "react";
import paths from "@/utils/paths";
import { isMobile } from "react-device-detect";
import useUser from "@/hooks/useUser";
import Appearance from "@/models/appearance";
import useLogo from "@/hooks/useLogo";
import Workspace from "@/models/workspace";
import { NavLink } from "react-router-dom";
import { LAST_VISITED_WORKSPACE } from "@/utils/constants";
import { useTranslation } from "react-i18next";
import { safeJsonParse } from "@/utils/request";
import { ArrowRight, ShieldCheck } from "@phosphor-icons/react";

export default function DefaultChatContainer() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { logo } = useLogo();
  const [lastVisitedWorkspace, setLastVisitedWorkspace] = useState(null);
  const [{ workspaces, loading }, setWorkspaces] = useState({
    workspaces: [],
    loading: true,
  });

  useEffect(() => {
    async function fetchWorkspaces() {
      const availableWorkspaces = await Workspace.all();
      const serializedLastVisitedWorkspace = localStorage.getItem(
        LAST_VISITED_WORKSPACE
      );
      if (!serializedLastVisitedWorkspace)
        return setWorkspaces({
          workspaces: availableWorkspaces,
          loading: false,
        });

      try {
        const lastVisitedWorkspace = safeJsonParse(
          serializedLastVisitedWorkspace,
          null
        );
        if (lastVisitedWorkspace == null) throw new Error("Non-parseable!");
        const isValid = availableWorkspaces.some(
          (ws) => ws.slug === lastVisitedWorkspace?.slug
        );
        if (!isValid) throw new Error("Invalid value!");
        setLastVisitedWorkspace(lastVisitedWorkspace);
      } catch {
        localStorage.removeItem(LAST_VISITED_WORKSPACE);
      } finally {
        setWorkspaces({ workspaces: availableWorkspaces, loading: false });
      }
    }
    fetchWorkspaces();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="xscale-grid w-full h-full flex flex-col items-center justify-center overflow-y-auto no-scroll">
          {/* Logo skeleton */}
          <div className="w-[140px] h-[140px] mb-5 rounded-lg bg-theme-bg-primary animate-pulse" />
          {/* Title skeleton */}
          <div className="w-48 h-6 mb-4 rounded bg-theme-bg-primary animate-pulse" />
          {/* Paragraph skeleton */}
          <div className="w-80 h-4 mb-2 rounded bg-theme-bg-primary animate-pulse" />
          <div className="w-64 h-4 rounded bg-theme-bg-primary animate-pulse" />
          {/* Button skeleton */}
          <div className="mt-[29px] w-40 h-[34px] rounded-lg bg-theme-bg-primary animate-pulse" />
        </div>
      </Layout>
    );
  }

  const hasWorkspaces = workspaces.length > 0;
  return (
    <Layout>
      <div className="xscale-grid w-full h-full flex flex-col items-center justify-center overflow-y-auto no-scroll px-6 py-20">
        <div className="animate-slideUp flex w-full max-w-2xl flex-col items-center text-center">
          <div className="xscale-glass mb-8 flex h-20 min-w-20 items-center justify-center rounded-2xl px-5">
            <img
              src={logo}
              alt="Custom Logo"
              className="max-h-12 w-auto rounded object-contain"
            />
          </div>
          <div className="mb-4 flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
            <ShieldCheck size={14} weight="duotone" />
            XSCALE AI
          </div>
          <h1 className="xscale-gradient-text text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            {t("home.welcome")}, {user.username}!
          </h1>
          <p className="mt-3 max-w-lg text-theme-home-text-secondary text-sm md:text-base text-center whitespace-pre-line leading-7">
            {hasWorkspaces ? t("home.chooseWorkspace") : t("home.notAssigned")}
          </p>
          {hasWorkspaces && (
            <NavLink
              to={paths.workspace.chat(
                lastVisitedWorkspace?.slug || workspaces[0].slug
              )}
              className="xscale-gradient-button mt-7 flex h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:-translate-y-0.5"
            >
              {t("home.goToWorkspace", {
                workspace: lastVisitedWorkspace?.name || workspaces[0].name,
              })}
              <ArrowRight size={17} weight="bold" />
            </NavLink>
          )}
        </div>
      </div>
    </Layout>
  );
}

const Layout = ({ children }) => {
  const { showScrollbar } = Appearance.getSettings();
  return (
    <div
      style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
      className={`relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[20px] bg-theme-bg-secondary border border-white/[0.06] light:border-theme-sidebar-border w-full h-full overflow-y-scroll shadow-[0_20px_70px_rgba(0,0,0,0.25)] ${showScrollbar ? "show-scrollbar" : "no-scroll"}`}
    >
      {children}
    </div>
  );
};
