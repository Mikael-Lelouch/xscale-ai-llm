import { useTranslation } from "react-i18next";
import useUser from "@/hooks/useUser";
import {
  FileArrowUp,
  Robot,
  SlidersHorizontal,
} from "@phosphor-icons/react";

/**
 * Quick action buttons for home and empty workspace states.
 * @param {Object} props
 * @param {boolean} props.hasAvailableWorkspace - Whether the user has a workspace they can use
 * @param {Function} props.onCreateAgent - Handler for "Create an Agent" action
 * @param {Function} props.onEditWorkspace - Handler for "Edit Workspace" action
 * @param {Function} props.onUploadDocument - Handler for "Upload a Document" action
 */
export default function QuickActions({
  hasAvailableWorkspace,
  onCreateAgent,
  onEditWorkspace,
  onUploadDocument,
}) {
  const { t } = useTranslation();
  const { user } = useUser();

  return (
    <div className="mt-6 flex w-full flex-wrap justify-center gap-2 md:gap-3">
      <QuickActionButton
        label={t("main-page.quickActions.createAgent")}
        icon={Robot}
        onClick={onCreateAgent}
        show={!user || ["admin"].includes(user?.role)}
      />
      <QuickActionButton
        label={t("main-page.quickActions.editWorkspace")}
        icon={SlidersHorizontal}
        onClick={onEditWorkspace}
        show={
          hasAvailableWorkspace &&
          (!user || ["admin", "manager"].includes(user?.role))
        }
      />
      <QuickActionButton
        label={t("main-page.quickActions.uploadDocument")}
        icon={FileArrowUp}
        onClick={onUploadDocument}
        // Any user can upload documents.
        show={true}
      />
    </div>
  );
}

function QuickActionButton({ label, icon: Icon, onClick, show = true }) {
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="xscale-card group flex min-h-[84px] w-[calc(50%-4px)] min-w-[150px] flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:text-cyan-100 light:bg-white light:text-theme-text-primary md:min-w-[190px]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-300 transition-all duration-300 group-hover:border-cyan-300/35 group-hover:bg-cyan-400/10 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.18)]">
        <Icon size={20} weight="duotone" />
      </span>
      <span className="leading-5">{label}</span>
    </button>
  );
}
