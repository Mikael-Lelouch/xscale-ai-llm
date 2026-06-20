#!/bin/bash

# XSCALE AI - Mistral Setup Script
# Déploie XSCALE AI avec Mistral en local

set -e

echo "🇫🇷 XSCALE AI - Mistral Setup (IA Souveraine Française)"
echo "========================================================"
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Visitez https://docs.docker.com/install/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Visitez https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker & Docker Compose détectés"
echo ""

# Créer les répertoires
mkdir -p ./storage ./models

# Démarrer les services
echo "🚀 Démarrage de XSCALE AI + Ollama..."
docker-compose -f docker-compose.local.yml up -d

echo ""
echo "⏳ Attente du démarrage d'Ollama (30 secondes)..."
sleep 30

# Vérifier Ollama
echo ""
echo "🔍 Vérification de la connexion à Ollama..."
for i in {1..10}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama est prêt!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Ollama n'a pas répondu après 30 secondes"
        echo "   Vérifiez les logs : docker logs xscale-ollama"
        exit 1
    fi
    echo "   Tentative $i/10..."
    sleep 3
done

# Télécharger Mistral
echo ""
echo "📦 Téléchargement de Mistral 7B (3.5GB)..."
echo "   Cela peut prendre 5-10 minutes selon votre connexion..."
docker exec xscale-ollama ollama pull mistral

echo ""
echo "✅ Installation terminée!"
echo ""
echo "========================================================"
echo "🎉 XSCALE AI est maintenant prêt!"
echo ""
echo "📱 Accédez à : http://localhost:3001"
echo ""
echo "🔗 Endpoints utiles :"
echo "   - Ollama : http://localhost:11434"
echo "   - API : http://localhost:3001/api/v1"
echo ""
echo "📚 Voir les logs :"
echo "   docker-compose -f docker-compose.local.yml logs -f"
echo ""
echo "🛑 Arrêter :"
echo "   docker-compose -f docker-compose.local.yml down"
echo ""
echo "========================================================"
