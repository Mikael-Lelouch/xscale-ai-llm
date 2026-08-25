import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import paths from "@/utils/paths";

export default function KnowledgeGraphRow({ workspace = null, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!workspace?.slug) return null;

  function handleClick() {
    navigate(paths.workspace.knowledgeGraph(workspace.slug));
    onClose?.();
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-zinc-700 light:hover:bg-slate-200"
    >
      <span className="text-sm font-normal text-white light:text-slate-800">
        {t("knowledgeGraph.open")}
      </span>
    </div>
  );
}
