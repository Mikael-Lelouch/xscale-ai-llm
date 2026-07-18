import React, { useState, useMemo, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import { useTranslation } from "react-i18next";
import paths from "@/utils/paths";
import AgentFlows from "@/models/agentFlows";
import showToast from "@/utils/toast";
import { Link } from "react-router-dom";
import {
  ShieldWarning,
  Bug,
  Robot,
  ChartBar,
  Code,
  FileText,
  Lock,
  Database,
  Brain,
  MagnifyingGlass,
  ArrowRight,
  Storefront,
  Lightning,
  CheckCircle,
  CircleNotch,
  Plus,
} from "@phosphor-icons/react";

// Helper: generate a valid flow config for AnythingLLM Agent Builder
// Format: { name, description, steps: [{type, config}] }
// Valid block types: start, llmInstruction, apiCall, webScraping, finish
function makeFlowConfig(name, description, instruction) {
  return {
    name,
    description,
    steps: [
      {
        type: "start",
        config: {
          variables: [{ name: "input", value: "" }],
        },
      },
      {
        type: "llmInstruction",
        config: {
          instruction: instruction,
          resultVariable: "result",
          directOutput: false,
        },
      },
      {
        type: "finish",
        config: {},
      },
    ],
  };
}

// --- Agent catalog with valid flow configs ---
const AGENT_CATALOG = [
  {
    id: "soc-analyst",
    category: "soc",
    icon: ShieldWarning,
    accent: "emerald",
    name: "SOC Analyst",
    tagline: "Analyse d'incidents en temps réel",
    description:
      "Agent d'analyse SOC qui corrèle les alertes Wazuh, enrichit avec CTI et génère des rapports d'incident structurés.",
    skills: ["Wazuh correlation", "Threat enrichment", "Incident report"],
    tier: "pro",
    instruction:
      "You are a SOC Analyst agent. Analyze the provided security alerts, correlate indicators of compromise, enrich with threat intelligence context, and generate a structured incident report with severity, affected assets, IOCs, and recommended actions.",
  },
  {
    id: "pentest-assistant",
    category: "cyber",
    icon: Bug,
    accent: "emerald",
    name: "Pentest Assistant",
    tagline: "Assistant audit & pentest",
    description:
      "Guide les phases de pentest (recon, enum, exploit, report). Compatible OWASP Top 10 & PTES.",
    skills: ["OWASP", "Nmap analysis", "Report gen"],
    tier: "pro",
    instruction:
      "You are a Pentest Assistant following OWASP Top 10 and PTES methodology. Guide the user through pentest phases: reconnaissance, enumeration, exploitation, and reporting. Provide specific commands, explain findings, and generate a structured pentest report.",
  },
  {
    id: "devops-pilot",
    category: "devops",
    icon: Lightning,
    accent: "teal",
    name: "DevOps Pilot",
    tagline: "Automatisation CI/CD & infra",
    description:
      "Génère pipelines CI/CD, Dockerfiles optimisés, et playbooks Ansible. Analyse les logs de déploiement.",
    skills: ["Docker", "CI/CD", "Ansible"],
    tier: "free",
    instruction:
      "You are a DevOps Pilot agent. Generate optimized CI/CD pipelines, Dockerfiles, and Ansible playbooks based on the user's requirements. Analyze deployment logs and suggest fixes. Follow best practices for security, caching, and reliability.",
  },
  {
    id: "data-explorer",
    category: "data",
    icon: ChartBar,
    accent: "cyan",
    name: "Data Explorer",
    tagline: "Exploration & visualisation de données",
    description:
      "Interroge vos bases SQL/Postgres, génère des graphiques et exports CSV. Idéal pour reporting rapide.",
    skills: ["SQL", "Chart gen", "CSV export"],
    tier: "free",
    instruction:
      "You are a Data Explorer agent. Write and optimize SQL queries for the user's database, explain query plans, generate data visualization suggestions, and export results as CSV. Support PostgreSQL, MySQL, and SQLite dialects.",
  },
  {
    id: "code-reviewer",
    category: "dev",
    icon: Code,
    accent: "violet",
    name: "Code Reviewer",
    tagline: "Review automatisée & sécurité",
    description:
      "Analyse diffs Git, détecte vulnérabilités (SAST), suggère best practices. Intégration PR GitHub.",
    skills: ["Git diff", "SAST scan", "PR comments"],
    tier: "pro",
    instruction:
      "You are a Code Reviewer agent. Analyze git diffs for vulnerabilities using SAST principles, detect security issues, suggest best practices, and generate structured PR review comments with severity levels and fix recommendations.",
  },
  {
    id: "doc-generator",
    category: "dev",
    icon: FileText,
    accent: "cyan",
    name: "Doc Generator",
    tagline: "Documentation technique auto",
    description:
      "Génère documentation API (OpenAPI), READMEs, et guides d'architecture à partir du code source.",
    skills: ["OpenAPI", "Markdown", "Arch diagrams"],
    tier: "free",
    instruction:
      "You are a Doc Generator agent. Analyze source code and generate comprehensive documentation: OpenAPI specs for APIs, README files, architecture diagrams in mermaid, and developer guides. Follow clear, professional documentation standards.",
  },
  {
    id: "secrets-hunter",
    category: "cyber",
    icon: Lock,
    accent: "emerald",
    name: "Secrets Hunter",
    tagline: "Détection de secrets leakés",
    description:
      "Scanne repos, logs et configs pour détecter secrets/API keys/mots de passe exposés. Compatible TruffleHog.",
    skills: ["Repo scan", "Pattern match", "Alert gen"],
    tier: "pro",
    instruction:
      "You are a Secrets Hunter agent. Scan provided code, logs, and config files for leaked secrets, API keys, passwords, and tokens. Use pattern matching similar to TruffleHog. Generate alerts with file location, secret type, and remediation steps.",
  },
  {
    id: "db-architect",
    category: "data",
    icon: Database,
    accent: "teal",
    name: "DB Architect",
    tagline: "Design & optimisation BDD",
    description:
      "Génère schémas SQL, propose optimisations d'index, et analyse les plans d'exécution lents.",
    skills: ["Schema design", "Index tuning", "Explain plan"],
    tier: "free",
    instruction:
      "You are a DB Architect agent. Design SQL schemas from requirements, propose index optimizations, analyze slow EXPLAIN plans, and suggest query rewrites. Support PostgreSQL, MySQL, and SQLite. Include normalization and performance considerations.",
  },
  {
    id: "threat-intel",
    category: "soc",
    icon: MagnifyingGlass,
    accent: "emerald",
    name: "Threat Intel Bot",
    tagline: "Veille & IOC enrichment",
    description:
      "Collecte IOCs, enrichit avec MITRE ATT&CK, et génère flux d'intelligence pour votre SIEM.",
    skills: ["MITRE ATT&CK", "IOC collection", "SIEM feed"],
    tier: "pro",
    instruction:
      "You are a Threat Intel Bot agent. Collect and enrich IOCs with MITRE ATT&CK technique mappings, generate structured threat intelligence feeds compatible with SIEM ingestion, and provide context on threat actors and campaigns.",
  },
  {
    id: "ai-researcher",
    category: "ai",
    icon: Brain,
    accent: "violet",
    name: "AI Researcher",
    tagline: "Recherche & synthèse LLM",
    description:
      "Synthèse de papiers arXiv, benchmarks modèles, et veille AI. Génère résumés techniques structurés.",
    skills: ["ArXiv search", "Paper summary", "Benchmark"],
    tier: "free",
    instruction:
      "You are an AI Researcher agent. Synthesize arXiv papers, benchmark LLM models, track AI research trends, and generate structured technical summaries with key findings, methodology, and implications.",
  },
  {
    id: "compliance-auditor",
    category: "cyber",
    icon: ShieldWarning,
    accent: "emerald",
    name: "Compliance Auditor",
    tagline: "Audit NIS2 / DORA / HDS",
    description:
      "Vérifie conformité NIS2/DORA/HDS, génère matrices de contrôle et plans de remédiation.",
    skills: ["NIS2", "DORA", "HDS", "Remediation"],
    tier: "pro",
    instruction:
      "You are a Compliance Auditor agent for NIS2, DORA, and HDS frameworks. Audit the provided systems and processes, generate control matrices, identify gaps, and produce remediation plans with priority levels and timelines.",
  },
  {
    id: "incident-responder",
    category: "soc",
    icon: Robot,
    accent: "emerald",
    name: "Incident Responder",
    tagline: "Réponse à incident automatisée",
    description:
      "Triage, containment suggestions, et post-mortem auto. Intégration TheHive pour playbook execution.",
    skills: ["Triage", "Containment", "Post-mortem", "TheHive"],
    tier: "pro",
    instruction:
      "You are an Incident Responder agent. Triage security incidents by severity, suggest containment actions, generate post-mortem reports, and produce TheHive-compatible playbook steps for automated response.",
  },
];

const CATEGORIES = [
  { id: "all", label: "Tous", icon: Storefront },
  { id: "soc", label: "SOC", icon: ShieldWarning },
  { id: "cyber", label: "Cybersécurité", icon: Lock },
  { id: "devops", label: "DevOps", icon: Lightning },
  { id: "data", label: "Data", icon: Database },
  { id: "dev", label: "Développement", icon: Code },
  { id: "ai", label: "AI", icon: Brain },
];

const ACCENT_COLORS = {
  cyan: { text: "text-cyan-400", border: "border-cyan-400/20", bg: "bg-cyan-400/[0.08]", glow: "rgba(6,182,212,0.1)" },
  teal: { text: "text-teal-400", border: "border-teal-400/20", bg: "bg-teal-400/[0.08]", glow: "rgba(20,184,166,0.1)" },
  emerald: { text: "text-emerald-400", border: "border-emerald-400/20", bg: "bg-emerald-400/[0.08]", glow: "rgba(16,185,129,0.1)" },
  violet: { text: "text-violet-400", border: "border-violet-400/20", bg: "bg-violet-400/[0.08]", glow: "rgba(139,92,246,0.1)" },
};

export default function MarketplaceSettings() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [installedAgents, setInstalledAgents] = useState([]);
  const [installing, setInstalling] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load installed agents on mount
  useEffect(() => {
    async function loadInstalled() {
      try {
        const { flows } = await AgentFlows.listFlows();
        setInstalledAgents(flows || []);
      } catch (e) {
        console.error("Failed to load installed agents", e);
      } finally {
        setLoading(false);
      }
    }
    loadInstalled();
  }, []);

  const isAgentInstalled = (agentId) => {
    return installedAgents.some(
      (f) => f.config?.type === agentId || f.name?.toLowerCase().includes(agentId)
    );
  };

  const handleInstall = async (agent) => {
    setInstalling(agent.id);
    try {
      const flowConfig = makeFlowConfig(
        agent.name,
        agent.description,
        agent.instruction
      );
      const result = await AgentFlows.saveFlow(
        agent.name,
        flowConfig
      );
      if (result.success) {
        showToast("Agent installé avec succès", "success");
        // Refresh installed list
        const { flows } = await AgentFlows.listFlows();
        setInstalledAgents(flows || []);
      } else {
        showToast(result.error || "Échec de l'installation", "error");
      }
    } catch (e) {
      showToast("Erreur lors de l'installation: " + e.message, "error");
    } finally {
      setInstalling(null);
    }
  };

  const filteredAgents = useMemo(() => {
    return AGENT_CATALOG.filter((agent) => {
      const matchesCategory =
        activeCategory === "all" || agent.category === activeCategory;
      const matchesSearch =
        !search ||
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.tagline.toLowerCase().includes(search.toLowerCase()) ||
        agent.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[20px] bg-theme-bg-secondary border border-white/[0.06] w-full h-full overflow-y-scroll shadow-[0_16px_50px_rgba(0,0,0,0.2)]"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[86px] md:py-6 py-16">
          {/* Header */}
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white light:border-theme-sidebar-border border-b-2 border-opacity-10">
            <div className="flex items-center gap-3">
              <div className="xscale-glass flex items-center justify-center rounded-xl w-10 h-10">
                <Storefront size={20} className="text-cyan-400" weight="duotone" />
              </div>
              <div>
                <p className="text-lg leading-6 font-bold text-white">
                  Marketplace d'Agents
                </p>
                <p className="text-xs leading-[18px] font-base text-white text-opacity-60">
                  Catalogue d'agents IA prêts à l'emploi pour vos opérations SOC,
                  cybersécurité, DevOps et développement.
                </p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-6 relative max-w-xl">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un agent, une compétence..."
              className="xscale-composer w-full rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder:text-white/40 outline-none"
            />
            <MagnifyingGlass
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/60 pointer-events-none"
            />
          </div>

          {/* Category filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "xscale-pill !border-cyan-400/40 !bg-cyan-400/10"
                      : "border border-white/[0.06] bg-white/[0.02] text-theme-text-secondary hover:text-white hover:border-white/[0.12]"
                  }`}
                >
                  <Icon size={16} weight={isActive ? "fill" : "regular"} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Installed count */}
          <div className="mt-4 flex items-center gap-2 text-sm text-theme-text-secondary">
            <CheckCircle size={16} className="text-emerald-400" weight="duotone" />
            <span>
              {installedAgents.length} agent{installedAgents.length > 1 ? "s" : ""} installé{installedAgents.length > 1 ? "s" : ""}
              {loading && " · Chargement..."}
            </span>
            {installedAgents.length > 0 && (
              <Link
                to={paths.agents.builder()}
                className="ml-2 text-cyan-400 hover:text-cyan-300 underline"
              >
                Gérer dans Agent Builder →
              </Link>
            )}
          </div>

          {/* Agent grid */}
          <div className="mt-6">
            {filteredAgents.length === 0 ? (
              <div className="xscale-glass rounded-2xl p-12 text-center">
                <p className="text-theme-text-secondary text-lg">
                  Aucun agent trouvé pour cette recherche.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map((agent, idx) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    index={idx}
                    installed={isAgentInstalled(agent.id)}
                    installing={installing === agent.id}
                    onInstall={() => handleInstall(agent)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, index, installed, installing, onInstall }) {
  const Icon = agent.icon;
  const accent = ACCENT_COLORS[agent.accent] || ACCENT_COLORS.cyan;
  const isPro = agent.tier === "pro";

  return (
    <div
      className="xscale-card rounded-2xl p-6 group animate-xscale-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Icon + tier badge */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl border ${accent.border} ${accent.bg}`}
        >
          <Icon size={24} className={accent.text} weight="duotone" />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {isPro ? (
            <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              PRO
            </span>
          ) : (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              FREE
            </span>
          )}
          {installed && (
            <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              <CheckCircle size={10} weight="fill" />
              Installé
            </span>
          )}
        </div>
      </div>

      {/* Name + tagline */}
      <h3 className="text-white text-lg font-semibold mb-1">
        {agent.name}
      </h3>
      <p className={`text-sm ${accent.text} font-medium mb-3`}>
        {agent.tagline}
      </p>

      {/* Description */}
      <p className="text-theme-text-secondary text-sm leading-relaxed mb-4">
        {agent.description}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {agent.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[11px] font-medium text-theme-text-secondary"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Action button */}
      <button
        onClick={onInstall}
        disabled={installed || installing}
        className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
          installed
            ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 cursor-default"
            : installing
            ? "xscale-gradient-button text-slate-950 cursor-wait"
            : "xscale-gradient-button text-slate-950 hover:-translate-y-0.5 cursor-pointer"
        }`}
      >
        {installed ? (
          <>
            <CheckCircle size={16} weight="bold" />
            Installé
          </>
        ) : installing ? (
          <>
            <CircleNotch size={16} weight="bold" className="animate-spin" />
            Installation...
          </>
        ) : (
          <>
            <Plus size={16} weight="bold" />
            Installer l'agent
          </>
        )}
      </button>
    </div>
  );
}
