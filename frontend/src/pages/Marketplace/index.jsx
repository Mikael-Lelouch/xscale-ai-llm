import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import paths from "@/utils/paths";
import { useTranslation } from "react-i18next";
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
  CheckCircle,
  Lightning,
} from "@phosphor-icons/react";

// --- Agent catalog ---
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
  },
  {
    id: "threat-intel",
    category: "soc",
    icon: Search,
    accent: "emerald",
    name: "Threat Intel Bot",
    tagline: "Veille & IOC enrichment",
    description:
      "Collecte IOCs, enrichit avec MITRE ATT&CK, et génère flux d'intelligence pour votre SIEM.",
    skills: ["MITRE ATT&CK", "IOC collection", "SIEM feed"],
    tier: "pro",
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
  cyan: { text: "text-cyan-400", border: "border-cyan-400/20", bg: "bg-cyan-400/8", glow: "rgba(6,182,212,0.1)" },
  teal: { text: "text-teal-400", border: "border-teal-400/20", bg: "bg-teal-400/8", glow: "rgba(20,184,166,0.1)" },
  emerald: { text: "text-emerald-400", border: "border-emerald-400/20", bg: "bg-emerald-400/8", glow: "rgba(16,185,129,0.1)" },
  violet: { text: "text-violet-400", border: "border-violet-400/20", bg: "bg-violet-400/8", glow: "rgba(139,92,246,0.1)" },
};

export default function Marketplace() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

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
    <div
      className="xscale-shell w-full h-full overflow-y-auto"
      style={{ minHeight: "100vh" }}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="xscale-glass flex items-center justify-center rounded-2xl w-12 h-12">
            <Storefront size={24} className="text-cyan-400" weight="duotone" />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
            <ShieldWarning size={12} weight="duotone" />
            XSCALE AI — MARKETPLACE
          </div>
        </div>

        <h1 className="xscale-gradient-text text-4xl font-bold tracking-[-0.03em] mb-3">
          Marketplace d'Agents
        </h1>
        <p className="text-theme-text-secondary text-base max-w-2xl leading-7">
          Catalogue d'agents IA prêts à l'emploi pour vos opérations SOC,
          cybersécurité, DevOps et développement. Chaque agent est configurable
          et s'intègre nativement avec votre infrastructure XSCALE.
        </p>

        {/* Search bar */}
        <div className="mt-8 relative max-w-xl">
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
      </div>

      {/* Category filters */}
      <div className="max-w-6xl mx-auto px-6 pb-6">
        <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Agent grid */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        {filteredAgents.length === 0 ? (
          <div className="xscale-glass rounded-2xl p-12 text-center">
            <p className="text-theme-text-secondary text-lg">
              Aucun agent trouvé pour cette recherche.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent, idx) => (
              <AgentCard key={agent.id} agent={agent} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent, index }) {
  const Icon = agent.icon;
  const accent = ACCENT_COLORS[agent.accent] || ACCENT_COLORS.cyan;
  const isPro = agent.tier === "pro";

  return (
    <div
      className="xscale-card rounded-2xl p-6 cursor-pointer group animate-xscale-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Icon + tier badge */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl border ${accent.border} ${accent.bg}`}
        >
          <Icon size={24} className={accent.text} weight="duotone" />
        </div>
        {isPro ? (
          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            PRO
          </span>
        ) : (
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            FREE
          </span>
        )}
      </div>

      {/* Name + tagline */}
      <h3 className="text-white text-lg font-semibold mb-1 group-hover:text-cyan-300 transition-colors">
        {agent.name}
      </h3>
      <p className={`text-sm ${accent.text} font-medium mb-3`}>
        {agent.tagline}
      </p>

      {/* Description */}
      <p className="text-theme-text-secondary text-sm leading-relaxed mb-4 line-clamp-3">
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

      {/* Action */}
      <div className="flex items-center gap-2 text-sm font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors">
        <span>Installer l'agent</span>
        <ArrowRight
          size={16}
          weight="bold"
          className="group-hover:translate-x-1 transition-transform"
        />
      </div>
    </div>
  );
}
