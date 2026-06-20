#!/bin/bash

# XSCALE AI - Agent Monitoring Script
# Affiche le status des agents en développement en temps réel

BASE_PATH="/root/.claude/projects/-home-user-xscale-ai-llm/de972fb4-5846-574f-b89a-b3e7a7e42fc9/subagents"

agents=(
  "ad1ff1380330df0a0:⚙️  Local Models Backend API"
  "a8f8f6b930c05fb80:🤖 Agent Flow Execution"
  "aa607394e6ebeb2c3:🔌 WebSocket Simplification"
  "af5db67637d318471:🌍 EU Cloud Detection"
  "ab789ecd5820bf930:📁 Document Lazy Loading"
  "a5258cee89b8b57cd:📊 Sovereignty Dashboard"
)

show_status() {
  clear
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║        🚀 XSCALE AI - AGENT DEVELOPMENT MONITORING 🚀        ║"
  echo "║                  $(date '+%Y-%m-%d %H:%M:%S')                     ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  echo ""

  completed=0
  in_progress=0

  for agent_info in "${agents[@]}"; do
    agent_id="${agent_info%:*}"
    agent_name="${agent_info#*:}"
    output_file="${BASE_PATH}/agent-${agent_id}.jsonl"

    if [ -f "$output_file" ]; then
      lines=$(wc -l < "$output_file")
      size=$(du -h "$output_file" | cut -f1)

      # Check status
      if grep -q '"status":"completed"' "$output_file"; then
        echo "✅ $agent_name"
        echo "   └─ Status: TERMINÉ | Lines: $lines | Size: $size"
        completed=$((completed + 1))
      elif grep -q '"status":"error"' "$output_file"; then
        echo "❌ $agent_name"
        echo "   └─ Status: ERREUR | Lines: $lines | Size: $size"
      else
        # Get progress from last lines
        recent=$(tail -5 "$output_file" | grep -i 'progress\|creating\|implementing\|adding' | tail -1)
        if [ -n "$recent" ]; then
          progress=$(echo "$recent" | grep -o '"content":"[^"]*' | cut -d'"' -f4 | head -c 60)
        else
          progress="Travail en cours..."
        fi

        echo "🔄 $agent_name"
        echo "   └─ Status: EN COURS | Lines: $lines | Size: $size"
        echo "   └─ Activité: $progress"
        in_progress=$((in_progress + 1))
      fi
      echo ""
    fi
  done

  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║  Résumé: ✅ $completed Terminés | 🔄 $in_progress En cours        ║"
  echo "║  Prochaine vérification dans 10 secondes...                   ║"
  echo "║  (Ctrl+C pour arrêter)                                        ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
}

# Monitoring loop
while true; do
  show_status
  sleep 10
done
