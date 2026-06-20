import React, { useState } from "react";
import {
  Lock,
  Download,
  Copy,
  Check,
  Code,
  Shield,
  CheckCircle,
} from "@phosphor-icons/react";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

export default function LocalDeployment() {
  const [copiedCode, setCopiedCode] = useState(false);

  const dockerComposeCode = `version: '3.8'
services:
  mistral:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    environment:
      - OLLAMA_HOST=0.0.0.0:11434
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

volumes:
  ollama_data:`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(dockerComposeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const models = [
    {
      name: "Mistral 7B",
      provider: "Mistral AI",
      size: "7B Parameters",
      capabilities:
        "Fast, efficient, multilingual support, excellent for French",
      downloadLink: "https://ollama.ai/library/mistral",
    },
    {
      name: "Llama 3.3",
      provider: "Meta",
      size: "70B Parameters",
      capabilities:
        "High performance, superior reasoning, GDPR-compliant via Ollama",
      downloadLink: "https://ollama.ai/library/llama3",
    },
    {
      name: "Zephyr 7B Beta",
      provider: "HuggingFace Community",
      size: "7B Parameters",
      capabilities:
        "Instruction-tuned, conversational, open-source optimized",
      downloadLink: "https://ollama.ai/library/zephyr",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-xscale-night text-theme-text-primary">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-xscale-night via-xscale-night-2 to-xscale-night-3 px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Main Headline */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-xscale-cyan via-xscale-cyan-bright to-xscale-teal bg-clip-text text-transparent">
              Déploiement Local
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              IA Souveraine Française
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Vos données restent en France. Zéro serveur tiers. 100% transparent.
            </p>
          </div>

          {/* Three Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {/* Pillar 1: Data Security */}
            <div className="bg-gradient-to-br from-xscale-night-2 to-xscale-night-3 border border-xscale-cyan/20 rounded-lg p-6 hover:border-xscale-cyan/50 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-xscale-cyan/10 mb-4">
                <Lock className="w-6 h-6 text-xscale-cyan" weight="bold" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Données Privées
              </h3>
              <p className="text-gray-300 text-sm">
                GDPR compliant. Aucune donnée n'est envoyée à des serveurs
                externes. Votre infrastructure, votre contrôle.
              </p>
            </div>

            {/* Pillar 2: French/EU */}
            <div className="bg-gradient-to-br from-xscale-night-2 to-xscale-night-3 border border-xscale-teal/20 rounded-lg p-6 hover:border-xscale-teal/50 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-xscale-teal/10 mb-4">
                <Code className="w-6 h-6 text-xscale-teal" weight="bold" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Modèles Français
              </h3>
              <p className="text-gray-300 text-sm">
                Support natif pour Mistral et autres modèles EU. Optimisés pour
                la langue française et les standards européens.
              </p>
            </div>

            {/* Pillar 3: Open Source */}
            <div className="bg-gradient-to-br from-xscale-night-2 to-xscale-night-3 border border-amber-400/20 rounded-lg p-6 hover:border-amber-400/50 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-xscale-amber/10 mb-4">
                <CheckCircle className="w-6 h-6 text-xscale-amber" weight="bold" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                100% Open Source
              </h3>
              <p className="text-gray-300 text-sm">
                Code transparente, auditable, et modifiable. Liberté totale sur
                vos processus IA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="w-full px-4 md:px-8 py-16 md:py-24 bg-xscale-night">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🚀 Déployer Mistral en 2 minutes
            </h2>
            <p className="text-gray-300 text-lg">
              Un seul fichier Docker Compose pour démarrer votre propre serveur
              IA.
            </p>
          </div>

          {/* Code Block */}
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 mb-6">
            <div className="flex items-center justify-between bg-gray-800 px-4 py-3 border-b border-gray-700">
              <span className="text-gray-300 font-mono text-sm">
                docker-compose.yml
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-3 py-1 rounded-md bg-xscale-cyan/10 hover:bg-xscale-cyan/20 text-xscale-cyan transition-colors duration-200"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4" weight="bold" />
                    <span className="text-xs font-medium">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" weight="bold" />
                    <span className="text-xs font-medium">Copier</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
              <code>{dockerComposeCode}</code>
            </pre>
          </div>

          {/* Installation Instructions */}
          <div className="bg-gradient-to-r from-xscale-cyan/10 to-xscale-teal/10 border border-xscale-cyan/20 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              Instructions de déploiement
            </h3>
            <ol className="space-y-3 text-gray-300">
              <li className="flex gap-3">
                <span className="text-xscale-cyan font-bold flex-shrink-0">
                  1.
                </span>
                <span>
                  Téléchargez et installez Docker depuis{" "}
                  <a
                    href="https://www.docker.com/products/docker-desktop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xscale-cyan hover:text-xscale-cyan-bright underline"
                  >
                    docker.com
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-xscale-cyan font-bold flex-shrink-0">
                  2.
                </span>
                <span>
                  Créez un dossier, collez le fichier compose-docker et
                  exécutez :{" "}
                  <code className="bg-gray-900 px-2 py-1 rounded text-xscale-cyan-bright">
                    docker-compose up
                  </code>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-xscale-cyan font-bold flex-shrink-0">
                  3.
                </span>
                <span>
                  Accédez à votre serveur IA sur{" "}
                  <code className="bg-gray-900 px-2 py-1 rounded text-xscale-cyan-bright">
                    http://localhost:11434
                  </code>
                </span>
              </li>
            </ol>
          </div>

          {/* Alternative Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a
              href="https://ollama.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-br from-xscale-night-2 to-xscale-night-3 border border-gray-700 hover:border-xscale-cyan/50 rounded-lg p-6 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <Download className="w-6 h-6 text-xscale-cyan group-hover:text-xscale-cyan-bright" />
                <h4 className="text-lg font-semibold text-white">
                  Télécharger Ollama
                </h4>
              </div>
              <p className="text-gray-400 text-sm">
                Application standalone pour exécuter Mistral et d'autres modèles
                localement.
              </p>
            </a>

            <a
              href="https://lmstudio.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-br from-xscale-night-2 to-xscale-night-3 border border-gray-700 hover:border-xscale-teal/50 rounded-lg p-6 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <Download className="w-6 h-6 text-xscale-teal group-hover:text-green-400" />
                <h4 className="text-lg font-semibold text-white">
                  Télécharger LM Studio
                </h4>
              </div>
              <p className="text-gray-400 text-sm">
                Interface graphique intuitive avec support complet pour les
                modèles locaux.
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="w-full px-4 md:px-8 py-16 md:py-24 bg-gradient-to-b from-xscale-night to-xscale-night-2">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Modèles Recommandés
            </h2>
            <p className="text-gray-300 text-lg">
              Les meilleurs modèles pour déploiement local et souveraineté IA.
            </p>
          </div>

          {/* Models Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-xscale-cyan/10 to-xscale-teal/10 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Modèle
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Fournisseur
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Taille
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Capacités
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {models.map((model, index) => (
                  <tr
                    key={index}
                    className="hover:bg-xscale-night-3 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">
                          {model.name}
                        </p>
                        {index === 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-xscale-cyan/20 text-xscale-cyan-bright text-xs font-medium rounded">
                            ⭐ Recommandé
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {model.provider}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {model.size}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {model.capabilities}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={model.downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-xscale-cyan/10 hover:bg-xscale-cyan/20 text-xscale-cyan hover:text-xscale-cyan-bright transition-colors duration-200 text-sm font-medium"
                      >
                        <Download className="w-4 h-4" weight="bold" />
                        Télécharger
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-xscale-night-2 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-300 text-sm">
              <span className="font-semibold text-white">💡 Conseil :</span> Pour
              démarrer rapidement, installez Ollama et exécutez{" "}
              <code className="bg-gray-900 px-2 py-1 rounded text-xscale-cyan-bright">
                ollama run mistral
              </code>
              . Aucune configuration supplémentaire nécessaire !
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="w-full px-4 md:px-8 py-16 md:py-24 bg-xscale-night">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🛡️ Sécurité et Transparence
            </h2>
            <p className="text-gray-300 text-lg">
              Vos données, votre contrôle - garantie de souveraineté.
            </p>
          </div>

          {/* Security Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-xscale-night-2 to-xscale-night-3 border border-green-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-green-400" weight="bold" />
                <h4 className="text-lg font-semibold text-white">
                  GDPR Compliant
                </h4>
              </div>
              <p className="text-gray-400 text-sm">
                Conforme aux réglementations européennes. Pas de transfert de
                données hors de l'UE.
              </p>
            </div>

            <div className="bg-gradient-to-br from-xscale-night-2 to-xscale-night-3 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Code className="w-6 h-6 text-blue-400" weight="bold" />
                <h4 className="text-lg font-semibold text-white">
                  Open Source
                </h4>
              </div>
              <p className="text-gray-400 text-sm">
                Code totalement transparent et auditable. MIT License.
              </p>
            </div>

            <div className="bg-gradient-to-br from-xscale-night-2 to-xscale-night-3 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Lock className="w-6 h-6 text-purple-400" weight="bold" />
                <h4 className="text-lg font-semibold text-white">
                  Pas de Telemetry
                </h4>
              </div>
              <p className="text-gray-400 text-sm">
                Aucun suivi, aucune collecte de données d'usage.
              </p>
            </div>
          </div>

          {/* Guarantee Box */}
          <div className="bg-gradient-to-r from-xscale-cyan/20 via-xscale-teal/20 to-xscale-night border border-xscale-cyan/40 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Garantie de Souveraineté
            </h3>
            <p className="text-gray-200 text-lg mb-6 max-w-3xl mx-auto">
              Vos données restent sur votre machine. Zéro serveur tiers. Zéro
              stockage cloud. Vous avez le contrôle total sur votre
              infrastructure IA.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a
                href="/security-audit"
                className="px-6 py-3 rounded-lg bg-xscale-cyan/10 hover:bg-xscale-cyan/20 text-xscale-cyan-bright font-semibold transition-colors duration-200"
              >
                📋 Audit de Sécurité
              </a>
              <a
                href="/whitepaper"
                className="px-6 py-3 rounded-lg bg-xscale-teal/10 hover:bg-xscale-teal/20 text-xscale-teal font-semibold transition-colors duration-200"
              >
                📖 Whitepaper
              </a>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">
              Questions Fréquentes
            </h3>

            <div className="bg-xscale-night-2 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Combien d'espace disque ai-je besoin ?
              </h4>
              <p className="text-gray-300">
                Mistral 7B demande environ 15GB. Un serveur avec 8GB de RAM et
                20GB de disque est un bon point de départ.
              </p>
            </div>

            <div className="bg-xscale-night-2 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Est-ce compatible avec XSCALE AI ?
              </h4>
              <p className="text-gray-300">
                Oui ! XSCALE AI supporte nativement les déploiements locaux via
                Ollama, LM Studio, et Docker. Configuration zéro complexe
                requise.
              </p>
            </div>

            <div className="bg-xscale-night-2 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Puis-je utiliser ma GPU ?
              </h4>
              <p className="text-gray-300">
                Absolument ! CUDA (NVIDIA), ROCm (AMD), et Metal (Apple Silicon)
                sont tous supportés pour une accélération GPU.
              </p>
            </div>

            <div className="bg-xscale-night-2 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Quelle est la latence typique ?
              </h4>
              <p className="text-gray-300">
                Sur du hardware moderne, Mistral 7B génère ~20-30 tokens/sec
                (CPU), ou 100+ tokens/sec avec GPU.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full px-4 md:px-8 py-16 md:py-24 bg-gradient-to-br from-xscale-night-2 via-xscale-night to-xscale-night-3">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à reprendre le contrôle ?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Commencez votre voyage vers une IA souveraine et transparente.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a
              href="/deploy"
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-xscale-cyan to-xscale-teal hover:from-xscale-cyan-bright hover:to-xscale-teal text-white font-semibold transition-all duration-300 shadow-lg"
            >
              🚀 Déployer Maintenant
            </a>
            <a
              href="/docs/local-deployment"
              className="px-8 py-4 rounded-lg border-2 border-xscale-cyan hover:bg-xscale-cyan/10 text-xscale-cyan-bright font-semibold transition-all duration-300"
            >
              📚 Lire la Documentation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
