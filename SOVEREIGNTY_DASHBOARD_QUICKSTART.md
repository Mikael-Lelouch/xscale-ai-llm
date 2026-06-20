# Sovereignty Dashboard - Quick Start Guide

## 🚀 Launching the Dashboard

### For Users/Admins
1. Click **Settings** in the top navigation
2. In the left sidebar, click **Admin** section
3. Click **Tableau de Bord Souveraineté** (first item)

### Direct URL
```
https://your-xscale-instance.com/settings/sovereignty
```

## 📊 What You See

### 4 Status Cards (Top)
- 🟢 **Zéro Donnée Externe** - Compliance status
- 🇫🇷 **100% Modèles Français** - French model usage %
- 🔒 **Données Locales** - Storage location
- ⚖️ **Score de Conformité** - RGPD compliance %

### Data Residency Section
- 🗺️ France flag showing data location
- 📍 Physical storage path: `/app/server/storage`
- 📊 Quick stats: Inferences, Workspaces, Users (past 30 days)

### Model Usage Chart
- 📈 Pie chart of provider usage
- **Expected**: 100% Mistral/Ollama/Local
- **NOT expected**: OpenAI, Google, Claude (red flag if present)

### RGPD Compliance Checklist
- ✅ Aucune donnée envoyée à OpenAI/Google/Claude
- ✅ Aucune analytics/telemetry
- ✅ Chiffrement des données
- ✅ Sauvegarde locale disponible
- ✅ Aucune dépendance cloud obligatoire
- ✅ Code source transparent

### Activity Log
- Recent audit events (last 50)
- Filterable by event type
- CSV export button
- Shows: Date, Event Type, Provider, Model

## 📄 Generating Attestation PDF

### One-Click Download
1. Click **📄 Télécharger Attestation de Souveraineté** (top right)
2. PDF downloads as `attestation-souverainete-2026-06-20.pdf`

### PDF Contents
- 🇫🇷 "ATTESTATION DE SOUVERAINETÉ NUMÉRIQUE" header
- Compliance status (✓ CONFORME - 100%)
- Data residency: France (Local)
- Provider usage (30-day breakdown)
- 6 compliance checks (all pass/fail status)
- Footer: Confirms no external data transmission

### Use Cases
- **Government Audits**: Show to ANSSI, CNIL
- **Enterprise RFP**: Include in compliance documentation
- **Bank Requirements**: Proof of data sovereignty
- **Legal Compliance**: Evidence of RGPD compliance

## 🔄 Auto-Refresh

Dashboard automatically updates **every 5 minutes**:
- ✓ Compliance status
- ✓ Inference counts
- ✓ Provider usage stats
- ✓ Activity log

Manual refresh: Click **🔄 Actualiser** button

## 🎯 Key Metrics Explained

### Compliance Score
```
100% = Zero external provider usage
0% = Any external provider detected
```

### Inferences (30 days)
Total count of LLM inference calls in the past month.

### Model Usage %
- **Ollama**: Local model execution
- **Mistral**: French AI provider (acceptable)
- **Other**: Red flag - indicates non-compliance

### Data Location
- **France (Local)**: ✅ Compliant
- **/app/server/storage**: Exact storage path
- **SQLite**: Local database with optional encryption

## 💾 CSV Export

### Export Activity Log
1. Scroll to "Journal d'Activité" section
2. Click **📥 Exporter CSV** button
3. File downloads as `audit-log-2026-06-20.csv`

### CSV Columns
- Date & Time
- Event Type
- Event Name
- Provider
- Model
- Details (JSON metadata)

### Use Cases
- Long-term audit trail
- External compliance tools
- Historical analysis
- Proof of data residency

## 🛡️ Compliance Actions

### Export User Data
Click **📊 Exporter les données** to download all user data (GDPR right).

### Delete User Data
Click **🗑️ Supprimer les données** for right to be forgotten (irrevocable).

### View Retention Policy
Click **📋 Politique de rétention** to see data storage duration rules.

## ⚙️ System Configuration Display

Bottom of dashboard shows:

| Setting | Value | Meaning |
|---------|-------|---------|
| Provider LLM | Ollama | Main inference engine |
| Moteur d'Embedding | Local | Vector embeddings (local) |
| Base de Données Vectorielle | Lance (SQLite) | Vector DB is local |
| Telemetry | Désactivée | No external tracking |
| Localisation des Données | /app/server/storage | Exact data path |
| Dépendances Cloud | Aucune | Fully offline-capable |

## 🇫🇷 French Interface Elements

All text is in French for XSCALE's French market positioning:

- **Tableau de Bord** = Dashboard
- **Souveraineté** = Sovereignty
- **Donnée** = Data
- **Conforme** = Compliant
- **Attestation** = Certification/Attestation
- **Journal d'Activité** = Activity Log
- **Localisation** = Location/Residency

## ❓ Troubleshooting

### Dashboard doesn't load
1. Check you're logged in as **Admin**
2. Verify route: `/settings/sovereignty`
3. Check browser console for errors
4. Restart server and refresh page

### No data showing
1. Ensure migrations have run: `yarn prisma:setup`
2. Check database is accessible
3. Try clicking **🔄 Actualiser** to force refresh
4. Check server logs for API errors

### PDF export fails
1. Ensure `pdf-lib` is installed: `npm list pdf-lib`
2. Check server has write permissions to `/tmp`
3. Verify all required fonts are available
4. Check server logs for generation errors

### Compliance shows as non-compliant
1. Check for any external LLM provider usage in activity log
2. Verify telemetry is disabled: `DISABLE_TELEMETRY=true`
3. Check no OpenAI/Google API calls in logs
4. Review model list - should only show Ollama/Mistral/Local

## 📞 Support

For issues with the Sovereignty Dashboard:
1. Check `/SOVEREIGNTY_DASHBOARD_IMPLEMENTATION.md` for detailed documentation
2. Review audit logs in activity log for clues
3. Check server logs for API errors
4. Contact XSCALE support with dashboard screenshot

## 🎓 Presentation Tips

### Selling to Enterprises
**Talking Points**:
- "100% of your data stays in France"
- "Zero external API calls - models run locally"
- "Full RGPD compliance - we have the attestation"
- "Real-time audit trail of all inferences"
- "You can export your data anytime"

### For Government
**Emphasis**:
- "Conforme RGPD"
- "Data sovereignty guaranteed"
- "Downloadable attestation for CNIL/ANSSI"
- "Open-source for transparency"
- "No dependencies on foreign cloud"

### For Banks/Finance
**Highlight**:
- "Comprehensive audit log"
- "Compliance certification (PDF)"
- "Data encryption options"
- "Local backup available"
- "Zero third-party integrations"

---

**🚀 You're ready to showcase French AI Sovereignty!**

This dashboard is your proof point for "IA Souveraine Française" 🇫🇷
