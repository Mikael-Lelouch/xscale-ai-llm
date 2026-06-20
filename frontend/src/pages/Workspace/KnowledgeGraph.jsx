import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { useParams } from "react-router-dom";
import "./KnowledgeGraph.css";

/**
 * Knowledge Graph Visualization Component
 * Interactive D3.js graph showing document and concept relationships
 */
const KnowledgeGraph = () => {
  const { workspaceSlug } = useParams();
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Fetch graph data
  useEffect(() => {
    fetchGraphData();
    fetchStats();
  }, [workspaceSlug]);

  const fetchGraphData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/workspace/${workspaceSlug}/knowledge-graph`
      );
      if (!response.ok) throw new Error("Failed to fetch graph data");
      const data = await response.json();
      setGraphData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching graph data:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/workspace/${workspaceSlug}/knowledge-graph/stats`
      );
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [workspaceSlug]);

  // D3 Visualization
  useEffect(() => {
    if (!graphData || !containerRef.current) return;

    const filteredData = filterGraphData();
    if (filteredData.nodes.length === 0) {
      setError("No data to visualize");
      return;
    }

    renderGraph(filteredData);
  }, [graphData, relationshipFilter, selectedNode, darkMode]);

  const filterGraphData = () => {
    if (!graphData) return { nodes: [], edges: [] };

    let filteredEdges = graphData.edges;
    if (relationshipFilter) {
      filteredEdges = filteredEdges.filter(
        (e) => e.relationshipType === relationshipFilter
      );
    }

    // Get node IDs that should be visible
    const visibleNodeIds = new Set();
    filteredEdges.forEach((edge) => {
      visibleNodeIds.add(edge.source);
      visibleNodeIds.add(edge.target);
    });

    // Always show all nodes (or filtered by search)
    let visibleNodes = graphData.nodes;
    if (searchTerm) {
      visibleNodes = visibleNodes.filter((n) =>
        n.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return {
      nodes: visibleNodes,
      edges: filteredEdges,
    };
  };

  const renderGraph = (data) => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", darkMode ? "#1a1a1a" : "#f5f5f5")
      .attr("class", "bg");

    // Create force simulation
    const simulation = d3
      .forceSimulation(data.nodes)
      .force(
        "link",
        d3
          .forceLink(data.edges)
          .id((d) => d.id)
          .distance(100)
          .strength(0.5)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Draw edges
    const links = svg
      .append("g")
      .selectAll("line")
      .data(data.edges)
      .enter()
      .append("line")
      .attr("stroke", darkMode ? "#666" : "#ccc")
      .attr("stroke-width", (d) => Math.sqrt(d.weight || 1))
      .attr("opacity", 0.6);

    // Draw edge labels
    const edgeLabels = svg
      .append("g")
      .selectAll("text")
      .data(data.edges)
      .enter()
      .append("text")
      .attr("font-size", "10px")
      .attr("fill", darkMode ? "#aaa" : "#666")
      .attr("text-anchor", "middle")
      .text((d) => d.relationshipType);

    // Draw nodes
    const nodes = svg
      .append("g")
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => (d.nodeType === "document" ? 12 : 8))
      .attr("fill", (d) => {
        if (d.nodeType === "document") return "#3b82f6";
        if (d.category === "person") return "#ef4444";
        if (d.category === "organization") return "#10b981";
        if (d.category === "location") return "#f59e0b";
        return "#8b5cf6";
      })
      .attr("opacity", 0.8)
      .attr("stroke", darkMode ? "#fff" : "#000")
      .attr("stroke-width", 2)
      .call(drag(simulation))
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // Draw labels
    const labels = svg
      .append("g")
      .selectAll("text")
      .data(data.nodes)
      .enter()
      .append("text")
      .attr("font-size", "11px")
      .attr("fill", darkMode ? "#e0e0e0" : "#333")
      .attr("text-anchor", "middle")
      .attr("dy", "-15px")
      .text((d) => d.label.substring(0, 20));

    // Update positions on simulation tick
    simulation.on("tick", () => {
      links
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      edgeLabels
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2);

      nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    // Click on background to deselect
    svg.on("click", () => setSelectedNode(null));

    // Zoom behavior
    const zoom = d3.zoom().on("zoom", (event) => {
      svg.selectAll("g").attr("transform", event.transform);
    });
    svg.call(zoom);

    return simulation;
  };

  const drag = (simulation) => {
    const dragstarted = (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragged = (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    };

    const dragended = (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    };

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  const exportGraph = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(graphData, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `knowledge-graph-${workspaceSlug}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const rebuildGraph = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/workspace/${workspaceSlug}/knowledge-graph/rebuild`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to rebuild graph");
      await fetchGraphData();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRelationshipTypes = () => {
    if (!graphData) return [];
    return [...new Set(graphData.edges.map((e) => e.relationshipType))];
  };

  return (
    <div className={`knowledge-graph-container ${darkMode ? "dark" : ""}`}>
      <div className="kg-header">
        <div className="kg-title">
          <h1>Knowledge Graph</h1>
          <p>Interactive visualization of document and concept relationships</p>
        </div>

        <div className="kg-controls">
          <input
            type="text"
            placeholder="Search concepts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="kg-search"
          />

          <select
            value={relationshipFilter}
            onChange={(e) => setRelationshipFilter(e.target.value)}
            className="kg-filter"
          >
            <option value="">All relationships</option>
            {getRelationshipTypes().map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button onClick={() => setDarkMode(!darkMode)} className="kg-btn">
            {darkMode ? "☀️" : "🌙"}
          </button>

          <button onClick={rebuildGraph} className="kg-btn" disabled={loading}>
            {loading ? "Rebuilding..." : "Rebuild"}
          </button>

          <button onClick={exportGraph} className="kg-btn">
            Export
          </button>
        </div>
      </div>

      <div className="kg-content">
        <div className="kg-stats">
          {stats && (
            <>
              <div className="stat-item">
                <span className="stat-label">Nodes</span>
                <span className="stat-value">{stats.totalNodes}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Edges</span>
                <span className="stat-value">{stats.totalEdges}</span>
              </div>
              {stats.nodeTypes && stats.nodeTypes.length > 0 && (
                <div className="stat-item">
                  <span className="stat-label">Types</span>
                  <div className="stat-breakdown">
                    {stats.nodeTypes.map((nt) => (
                      <span key={nt.type} className="stat-type">
                        {nt.type}: {nt.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="kg-graph-container" ref={containerRef}>
          {loading && (
            <div className="kg-loading">Loading knowledge graph...</div>
          )}
          {error && <div className="kg-error">Error: {error}</div>}
          <svg ref={svgRef}></svg>
        </div>

        {selectedNode && (
          <div className="kg-sidebar">
            <div className="kg-node-details">
              <h3>{selectedNode.label}</h3>
              <div className="kg-node-info">
                <p>
                  <strong>Type:</strong> {selectedNode.nodeType}
                </p>
                {selectedNode.category && (
                  <p>
                    <strong>Category:</strong> {selectedNode.category}
                  </p>
                )}
                {selectedNode.description && (
                  <p>
                    <strong>Description:</strong> {selectedNode.description}
                  </p>
                )}
                {selectedNode.docId && (
                  <p>
                    <strong>Document ID:</strong> {selectedNode.docId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="kg-legend">
        <h4>Legend</h4>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#3b82f6" }}></span>
          <span>Document</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#ef4444" }}></span>
          <span>Person</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#10b981" }}></span>
          <span>Organization</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#f59e0b" }}></span>
          <span>Location</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#8b5cf6" }}></span>
          <span>Concept</span>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
