import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";
import { castToType } from "@/utils/types";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Graph } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import VectorDBIdentifier from "./VectorDBIdentifier";
import MaxContextSnippets from "./MaxContextSnippets";
import DocumentSimilarityThreshold from "./DocumentSimilarityThreshold";
import ResetDatabase from "./ResetDatabase";
import VectorCount from "./VectorCount";
import VectorSearchMode from "./VectorSearchMode";
import CTAButton from "@/components/lib/CTAButton";
import paths from "@/utils/paths";

export default function VectorDatabase({ workspace }) {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const formEl = useRef(null);

  const handleUpdate = async (e) => {
    setSaving(true);
    e.preventDefault();
    const data = {};
    const form = new FormData(formEl.current);
    for (var [key, value] of form.entries()) data[key] = castToType(key, value);
    const { workspace: updatedWorkspace, message } = await Workspace.update(
      workspace.slug,
      data
    );
    if (!!updatedWorkspace) {
      showToast("Workspace updated!", "success", { clear: true });
    } else {
      showToast(`Error: ${message}`, "error", { clear: true });
    }
    setSaving(false);
    setHasChanges(false);
  };

  if (!workspace) return null;
  return (
    <div className="w-full relative">
      <form
        ref={formEl}
        onSubmit={handleUpdate}
        className="w-1/2 flex flex-col gap-y-[32px]"
      >
        {hasChanges && (
          <div className="absolute top-0 right-0">
            <CTAButton type="submit">
              {saving ? "Updating..." : "Update Workspace"}
            </CTAButton>
          </div>
        )}
        <div className="flex items-start gap-x-5">
          <VectorDBIdentifier workspace={workspace} />
          <VectorCount reload={true} workspace={workspace} />
        </div>
        <VectorSearchMode workspace={workspace} setHasChanges={setHasChanges} />
        <MaxContextSnippets
          workspace={workspace}
          setHasChanges={setHasChanges}
        />
        <DocumentSimilarityThreshold
          workspace={workspace}
          setHasChanges={setHasChanges}
        />
        <ResetDatabase workspace={workspace} />
        <div className="xscale-card rounded-2xl p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white font-medium mb-1">
              <Graph size={18} className="text-cyan-300" weight="duotone" />
              {t("knowledgeGraph.vectorCardTitle")}
            </div>
            <p className="text-sm text-theme-text-secondary leading-6 max-w-md">
              {t("knowledgeGraph.vectorCardDescription")}
            </p>
          </div>
          <Link
            to={paths.workspace.knowledgeGraph(slug || workspace.slug)}
            className="xscale-gradient-button h-9 px-4 rounded-full text-xs font-semibold text-slate-950 whitespace-nowrap flex items-center"
          >
            {t("knowledgeGraph.vectorCardCta")}
          </Link>
        </div>
      </form>
    </div>
  );
}
