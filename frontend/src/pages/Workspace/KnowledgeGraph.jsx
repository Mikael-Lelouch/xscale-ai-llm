import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import { isMobile } from "react-device-detect";
import * as d3 from "d3";
import {
  ArrowUUpLeft,
  Export,
  Graph,
  MagnifyingGlass,
  SpinnerGap,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import Sidebar, { SidebarMobileHeader } from "@/components/Sidebar";
import PasswordModal, { usePasswordModal } from "@/components/Modals/Password";
import { FullScreenLoader } from "@/components/Preloader";
import KnowledgeGraphModel from "@/models/knowledgeGraph";
import paths from "@/utils/paths";
import showToast from "@/utils/toast";

const NODE_COLORS = {
  document: "#22d3ee",
  person: "#f472b6",
  organization: "#14b8a6",
  location: "#fbbf24",
  concept: "#8b5cf6",
  topic: "#8b5cf6",
};

function nodeColor(node) {
  if (node?.nodeType === "document") return NODE_COLORS.document;
  return NODE_COLORS[node?.category] || NODE_COLORS.concept;
}

export default function KnowledgeGraphPage() {
  const { loading, requiresAuth, mode } = usePasswordModal();

  if (loading) return <FullScreenLoader />;
  if (requiresAuth !== false) {
    return <>{requiresAuth !== null && <PasswordModal mode={mode} />}</>;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-zinc-950 light:bg-slate-50 flex">
      {!isMobile && <Sidebar />}
      <KnowledgeGraphCanvas />
    </div>
  );
}

function KnowledgeGraphCanvas() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("");

  const loadGraph = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const [data, nextStats] = await Promise.all([
        KnowledgeGraphModel.get(slug),
        KnowledgeGraphModel.stats(slug),
      ]);
      if (data?.error && (!data.nodes || data.nodes.length === 0)) {
        setError(data.error);
      }
      setGraphData({
        nodes: data?.nodes || [],
        edges: data?.edges || [],
      });
      setStats(nextStats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const relationshipTypes = useMemo(() => {
    return [
      ...new Set((graphData.edges || []).map((edge) => edge.relationshipType)),
    ].filter(Boolean);
  }, [graphData.edges]);

  const filteredData = useMemo(() => {
    const nodes = graphData.nodes || [];
    const edges = graphData.edges || [];
    const query = searchTerm.trim().toLowerCase();

    let visibleEdges = edges;
    if (relationshipFilter) {
      visibleEdges = edges.filter(
        (edge) => edge.relationshipType === relationshipFilter
      );
    }

    let visibleNodes = nodes;
    if (query) {
      const matched = new Set(
        nodes
          .filter((node) => (node.label || "").toLowerCase().includes(query))
          .map((node) => node.id)
      );
      visibleEdges = visibleEdges.filter(
        (edge) => matched.has(edge.source) || matched.has(edge.target)
      );
      const neighborIds = new Set(matched);
      visibleEdges.forEach((edge) => {
        neighborIds.add(edge.source);
        neighborIds.add(edge.target);
      });
      visibleNodes = nodes.filter((node) => neighborIds.has(node.id));
    } else if (relationshipFilter) {
      const ids = new Set();
      visibleEdges.forEach((edge) => {
        ids.add(edge.source);
        ids.add(edge.target);
      });
      visibleNodes = nodes.filter((node) => ids.has(node.id));
    }

    return { nodes: visibleNodes, edges: visibleEdges };
  }, [graphData, searchTerm, relationshipFilter]);

  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }

    if (!filteredData.nodes.length) return;

    const nodes = filteredData.nodes.map((node) => ({ ...node }));
    const links = filteredData.edges.map((edge) => ({ ...edge }));

    const root = svg.append("g").attr("class", "kg-zoom-layer");
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(110)
          .strength(0.45)
      )
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(36));

    const link = root
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "rgba(34,211,238,0.28)")
      .attr("stroke-width", (d) => Math.max(1, Math.sqrt(d.weight || 1) / 2))
      .attr("opacity", 0.8);

    const node = root
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => (d.nodeType === "document" ? 11 : 7))
      .attr("fill", (d) => nodeColor(d))
      .attr("stroke", "rgba(15,20,34,0.9)")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    const labels = root
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("font-size", "11px")
      .attr("fill", "#e2e8f0")
      .attr("text-anchor", "middle")
      .attr("dy", "-14px")
      .attr("pointer-events", "none")
      .text((d) => (d.label || "").slice(0, 28));

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    svg.call(
      d3
        .zoom()
        .scaleExtent([0.4, 3])
        .on("zoom", (event) => {
          root.attr("transform", event.transform);
        })
    );
    svg.on("click", () => setSelectedNode(null));
    simulationRef.current = simulation;

    const observer = new ResizeObserver(() => {
      const nextWidth = container.clientWidth || 800;
      const nextHeight = container.clientHeight || 600;
      svg.attr("width", nextWidth).attr("height", nextHeight);
      simulation.force("center", d3.forceCenter(nextWidth / 2, nextHeight / 2));
      simulation.alpha(0.2).restart();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      simulation.stop();
      svg.on("click", null);
      svg.on(".zoom", null);
    };
  }, [filteredData]);

  async function handleRebuild() {
    if (!slug || rebuilding) return;
    setRebuilding(true);
    const result = await KnowledgeGraphModel.rebuild(slug);
    setRebuilding(false);
    if (!result?.success) {
      showToast(result?.error || t("knowledgeGraph.rebuildError"), "error", {
        clear: true,
      });
      return;
    }
    showToast(
      t("knowledgeGraph.rebuildSuccess", {
        nodes: result.nodesCreated ?? result.finalStats?.totalNodes ?? 0,
        edges: result.edgesCreated ?? result.finalStats?.totalEdges ?? 0,
        documents: result.documentsProcessed ?? 0,
      }),
      "success",
      { clear: true }
    );
    await loadGraph();
  }

  function handleExport() {
    const payload = {
      ...graphData,
      statistics: stats,
      exportedAt: new Date().toISOString(),
      workspace: slug,
    };
    const element = document.createElement("a");
    element.href = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    );
    element.download = `knowledge-graph-${slug}.json`;
    element.click();
    URL.revokeObjectURL(element.href);
  }

  const isEmpty = !loading && graphData.nodes.length === 0;

  return (
    <div
      style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
      className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[20px] xscale-grid-bg w-full h-full overflow-hidden border border-white/[0.06] light:border-theme-sidebar-border shadow-[0_16px_50px_rgba(0,0,0,0.2)] flex flex-col"
    >
      {isMobile && <SidebarMobileHeader />}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.06] light:border-theme-modal-border">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={paths.workspace.chat(slug)}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover text-white"
            aria-label={t("knowledgeGraph.backToChat")}
          >
            <ArrowUUpLeft className="h-5 w-5" weight="fill" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Graph size={18} className="text-cyan-300" weight="duotone" />
              <h1 className="xscale-gradient-text text-lg font-semibold truncate">
                {t("knowledgeGraph.title")}
              </h1>
            </div>
            <p className="text-xs text-theme-text-secondary mt-0.5 truncate">
              {t("knowledgeGraph.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {stats && (
            <>
              <span className="xscale-pill rounded-full px-3 py-1 text-[11px] uppercase tracking-wider">
                {t("knowledgeGraph.nodes")} {stats.totalNodes}
              </span>
              <span className="xscale-pill rounded-full px-3 py-1 text-[11px] uppercase tracking-wider">
                {t("knowledgeGraph.edges")} {stats.totalEdges}
              </span>
            </>
          )}
          <button
            type="button"
            onClick={handleRebuild}
            disabled={rebuilding}
            className="xscale-gradient-button h-9 px-4 rounded-full text-xs font-semibold text-slate-950 disabled:opacity-60"
          >
            {rebuilding
              ? t("knowledgeGraph.rebuilding")
              : t("knowledgeGraph.rebuild")}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!graphData.nodes.length}
            className="h-9 px-3 rounded-full border border-white/10 text-white/80 text-xs hover:border-cyan-400/40 disabled:opacity-40"
          >
            <span className="inline-flex items-center gap-1.5">
              <Export size={14} />
              {t("knowledgeGraph.export")}
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04]">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("knowledgeGraph.search")}
            className="xscale-composer w-full h-9 rounded-xl pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none"
          />
        </div>
        <select
          value={relationshipFilter}
          onChange={(event) => setRelationshipFilter(event.target.value)}
          className="h-9 rounded-xl bg-theme-bg-secondary border border-white/10 text-sm text-white px-3 outline-none"
        >
          <option value="">{t("knowledgeGraph.allRelationships")}</option>
          {relationshipTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex-1 min-h-0 flex">
        <div ref={containerRef} className="relative flex-1 min-w-0">
          {(loading || rebuilding) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
              <div className="xscale-glass rounded-2xl px-5 py-4 flex items-center gap-3 text-sm text-white">
                <SpinnerGap className="animate-spin" size={18} />
                {rebuilding
                  ? t("knowledgeGraph.rebuilding")
                  : t("knowledgeGraph.loading")}
              </div>
            </div>
          )}
          {isEmpty && !error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="xscale-glass max-w-md rounded-2xl p-8 text-center">
                <Graph
                  size={36}
                  className="mx-auto text-cyan-300 mb-4"
                  weight="duotone"
                />
                <h2 className="text-white text-lg font-semibold mb-2">
                  {t("knowledgeGraph.emptyTitle")}
                </h2>
                <p className="text-sm text-theme-text-secondary leading-6 mb-5">
                  {t("knowledgeGraph.emptyDescription")}
                </p>
                <button
                  type="button"
                  onClick={handleRebuild}
                  disabled={rebuilding}
                  className="xscale-gradient-button h-10 px-5 rounded-full text-sm font-semibold text-slate-950"
                >
                  {t("knowledgeGraph.emptyCta")}
                </button>
              </div>
            </div>
          )}
          {error && isEmpty && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="xscale-glass max-w-md rounded-2xl p-6 text-center text-sm text-rose-300">
                {t("knowledgeGraph.error")}
              </div>
            </div>
          )}
          <svg ref={svgRef} className="w-full h-full" role="img" />
        </div>

        {selectedNode && (
          <aside className="w-[280px] shrink-0 border-l border-white/[0.06] p-5 overflow-y-auto">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300 mb-2">
              {selectedNode.nodeType}
            </p>
            <h3 className="text-white font-semibold text-base mb-3 break-words">
              {selectedNode.label}
            </h3>
            <dl className="space-y-2 text-sm text-theme-text-secondary">
              {selectedNode.category && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/40">
                    {t("knowledgeGraph.category")}
                  </dt>
                  <dd>{selectedNode.category}</dd>
                </div>
              )}
              {selectedNode.description && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/40">
                    {t("knowledgeGraph.description")}
                  </dt>
                  <dd>{selectedNode.description}</dd>
                </div>
              )}
              {selectedNode.docId && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/40">
                    {t("knowledgeGraph.documentId")}
                  </dt>
                  <dd className="break-all font-mono text-xs">
                    {selectedNode.docId}
                  </dd>
                </div>
              )}
            </dl>
          </aside>
        )}
      </div>

      <div className="absolute bottom-4 left-5 xscale-glass rounded-xl px-3 py-2 flex flex-wrap gap-3 text-[11px] text-white/70">
        {Object.entries({
          document: t("knowledgeGraph.legendDocument"),
          person: t("knowledgeGraph.legendPerson"),
          organization: t("knowledgeGraph.legendOrganization"),
          location: t("knowledgeGraph.legendLocation"),
          concept: t("knowledgeGraph.legendConcept"),
        }).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: NODE_COLORS[key] }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
