# 🇫🇷 Déploiement Local - IA Souveraine Française

## À Propos

**XSCALE AI** peut être déployé entièrement en local, sans aucune donnée sortant de votre infrastructure.

- 🔒 **100% Privé** : Données jamais envoyées
- 🇫🇷 **Modèles Français** : Support natif de Mistral (leader français)
- 🔓 **Open Source** : Code transparent, auditable, sans vendor lock-in
- ⚡ **Rapide** : Déploiement en 2 minutes

---

## Déploiement Rapide (2 min)

### Prérequis

- Docker & Docker Compose installés
- 8GB RAM minimum (16GB recommandé pour Mistral)
- GPU optionnel (NVIDIA CUDA pour accélération)

### Étape 1 : Cloner le repo

```bash
git clone https://github.com/Mikael-Lelouch/xscale-ai-llm.git
cd xscale-ai-llm
```

### Étape 2 : Démarrer avec Docker Compose

```bash
docker-compose -f docker-compose.local.yml up -d
```

Cela démarre :
- **Ollama** : Service de modèles (port 11434)
- **XSCALE AI** : Application (port 3001)

### Étape 3 : Télécharger Mistral

```bash
# Attendre que Ollama soit prêt (30 sec)
sleep 30

# Télécharger Mistral 7B (3.5GB)
docker exec xscale-ollama ollama pull mistral

# Ou Mistral Large si vous avez la puissance
# docker exec xscale-ollama ollama pull mistral:large
```

### Étape 4 : Accéder à XSCALE AI

```
http://localhost:3001
```

Done! 🎉

---

## Modèles Recommandés

### 🏆 Mistral 7B (Recommandé)
- **Taille** : 3.5GB
- **Vitesse** : Rapide
- **Qualité** : Excellente pour la plupart des tâches
- **Commande** : `ollama pull mistral`

### 🌟 Mistral Large
- **Taille** : 26GB
- **Vitesse** : Lent mais très puissant
- **Qualité** : Meilleure qualité
- **Commande** : `ollama pull mistral:large`

### 🦙 Llama 3.3
- **Taille** : 70B (très gros) ou 8B (petit)
- **Vitesse** : Dépend du size
- **Qualité** : Excellent
- **Commande** : `ollama pull llama2:7b`

### ⚡ Zephyr 7B
- **Taille** : 3.8GB
- **Vitesse** : Très rapide
- **Qualité** : Bonne pour chat/instruction
- **Commande** : `ollama pull zephyr`

---

## Configuration Avancée

### Ajouter un GPU NVIDIA

Si vous avez un GPU NVIDIA :

```bash
# Installer NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

Puis éditer `docker-compose.local.yml` pour ajouter :

```yaml
services:
  ollama:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Modifier la Température/Paramètres

Éditer `/app/server/storage/settings.json` ou via l'interface Admin.

### Utiliser LM Studio à la Place

Si vous préférez LM Studio au lieu d'Ollama :

1. Télécharger LM Studio : https://lmstudio.ai
2. Charger un modèle dans LM Studio
3. Démarrer le serveur API (port 1234)
4. Dans XSCALE AI settings : Provider = "LM Studio"

---

## Vérifier le Statut

```bash
# Voir les logs
docker-compose -f docker-compose.local.yml logs -f

# Vérifier que Ollama est prêt
curl http://localhost:11434/api/tags

# Vérifier que XSCALE AI est prêt
curl http://localhost:3001/api/system

# Liste les modèles actuels
curl http://localhost:3001/api/v1/local-models/list
```

---

## Arrêter/Redémarrer

```bash
# Arrêter
docker-compose -f docker-compose.local.yml down

# Redémarrer
docker-compose -f docker-compose.local.yml up -d

# Voir les volumes (données persistent)
docker volume ls | grep xscale
```

---

## Sécurité & Compliance

### ✅ GDPR Compliant
- Toutes les données restent sur votre machine
- Pas de serveurs tiers
- Vous contrôlez les sauvegardes

### ✅ Open Source
- Code auditable sur GitHub
- Pas de dépendances commerciales
- Liberté de modifier et redistribuer

### ✅ Zero Telemetry
- Aucune collecte de données d'usage
- Aucun tracking
- Aucune analytics

---

## Dépannage

### Port 3001 déjà utilisé

```bash
# Voir ce qui utilise le port
lsof -i :3001

# Ou changer le port dans docker-compose.local.yml
# ports:
#   - "3002:3001"  # Utiliser 3002 à la place
```

### Ollama ne démarre pas

```bash
# Vérifier les logs Ollama
docker logs xscale-ollama

# Redémarrer
docker restart xscale-ollama
```

### Erreur "pas assez d'espace disque"

```bash
# Voir l'espace disque
df -h

# Nettoyer les anciennes images Docker
docker image prune -a
```

### Modèle lent

1. Vérifier la RAM disponible : `free -h`
2. Réduire la taille du modèle (utiliser mistral 7b au lieu de large)
3. Ajouter un GPU (voir section GPU)

---

## Support

- 📖 Documentation : [XSCALE Wiki](https://github.com/Mikael-Lelouch/xscale-ai-llm/wiki)
- 🐛 Issues : [GitHub Issues](https://github.com/Mikael-Lelouch/xscale-ai-llm/issues)
- 💬 Discussions : [GitHub Discussions](https://github.com/Mikael-Lelouch/xscale-ai-llm/discussions)

---

## Pro Tips 🚀

1. **Cache Models Locally** : Une fois Mistral téléchargé (~3.5GB), il est en cache. Les redémarrages sont instantanés.

2. **Multi-Models** : Vous pouvez télécharger plusieurs modèles dans Ollama et les échanger via les settings.

3. **Workspace Séparé** : Créer un workspace pour chaque use-case (dev, produit, recherche).

4. **Backup** : Sauvegarder le dossier `~/xscale_storage` pour persister les conversations et documents.

5. **Production** : Pour la prod, ajouter un reverse proxy (Nginx) avec SSL/TLS.

---

**Prêt à aller ?** → `docker-compose -f docker-compose.local.yml up -d` 🎉
