# Knowledge Graph Quick Start

## 5-Minute Setup

### 1. Database Migration (1 minute)

```bash
cd /home/user/xscale-ai-llm

# Run migration to create new tables
npm run prisma:migrate

# Or if using yarn:
yarn prisma migrate dev --name add_knowledge_graph_tables
```

This creates:
- `knowledge_graph_nodes` table
- `knowledge_graph_edges` table
- All indexes and foreign keys

### 2. Install Frontend Dependencies (1 minute)

```bash
cd frontend
npm install d3
# or: yarn add d3
```

### 3. Add Routes (1 minute)

The routes are **already added** in `server/endpoints/workspaces.js`:

```javascript
const knowledgeGraphRouter = require("./knowledgeGraph");
app.use("/v1/workspace", knowledgeGraphRouter);
```

Add to your frontend router in `frontend/src/main.jsx`:

```jsx
import KnowledgeGraph from "./pages/Workspace/KnowledgeGraph";

// Add this to your route config:
{
  path: "/workspace/:workspaceSlug/knowledge-graph",
  element: <KnowledgeGraph />,
}
```

### 4. Start the App (2 minutes)

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend (from frontend directory)
npm run dev
```

## Test It

### 1. Visit Workspace
Navigate to: `http://localhost:5173/workspace/your-workspace-slug/knowledge-graph`

### 2. Build Graph (via API)

```bash
# Rebuild entire workspace graph
curl -X POST http://localhost:3001/api/v1/workspace/your-workspace-slug/knowledge-graph/rebuild

# Response:
{
  "success": true,
  "documentsProcessed": 5,
  "nodesCreated": 23,
  "edgesCreated": 18,
  "finalStats": {
    "totalNodes": 23,
    "totalEdges": 18,
    "nodeTypes": [
      { "type": "document", "count": 5 },
      { "type": "concept", "count": 18 }
    ],
    "relationshipTypes": [
      { "type": "mentions", "count": 15 },
      { "type": "related", "count": 3 }
    ]
  }
}
```

### 3. View Graph Data

```bash
curl http://localhost:3001/api/v1/workspace/your-workspace-slug/knowledge-graph

# Returns nodes and edges in D3-compatible format
```

### 4. Search Concepts

```bash
curl http://localhost:3001/api/v1/workspace/your-workspace-slug/knowledge-graph/search?q=revenue

# Returns matching concept nodes
```

## Key Files

| File | Purpose |
|------|---------|
| `server/models/knowledgeGraph.js` | Data access layer (380 lines) |
| `server/utils/rag/graphBuilder.js` | Concept extraction (380 lines) |
| `server/endpoints/knowledgeGraph.js` | API endpoints (350 lines) |
| `frontend/src/pages/Workspace/KnowledgeGraph.jsx` | React component (350 lines) |
| `frontend/src/pages/Workspace/KnowledgeGraph.css` | Styling (300 lines) |
| `server/prisma/schema.prisma` | Database models (added) |

## Common Tasks

### Get Graph Statistics

```bash
curl http://localhost:3001/api/v1/workspace/your-workspace/knowledge-graph/stats
```

### Export Graph as JSON

```bash
curl http://localhost:3001/api/v1/workspace/your-workspace/knowledge-graph/export \
  > knowledge-graph.json
```

### Add Custom Relationship

```bash
curl -X POST http://localhost:3001/api/v1/workspace/your-workspace/knowledge-graph/edge \
  -H "Content-Type: application/json" \
  -d '{
    "fromNodeId": 1,
    "toNodeId": 2,
    "relationshipType": "contradicts",
    "weight": 45,
    "confidence": 0.7
  }'
```

### Search Nodes

```bash
curl 'http://localhost:3001/api/v1/workspace/your-workspace/knowledge-graph/search?q=finance'
```

## Visualization Features

### In the UI
- **Search Box**: Filter concepts by name
- **Relationship Filter**: Show only specific edge types
- **Dark Mode**: Toggle with moon/sun icon
- **Rebuild**: Rebuild entire graph
- **Export**: Download as JSON
- **Click Nodes**: See details in sidebar
- **Drag Nodes**: Move around canvas
- **Zoom/Pan**: Mouse wheel and drag

### Colors
- 🔵 Blue = Documents
- 🔴 Red = People
- 🟢 Green = Organizations
- 🟡 Amber = Locations
- 🟣 Purple = Concepts

## Next Steps

1. **Hook up document upload**:
   - After document is added to workspace, call:
   ```javascript
   await GraphBuilder.buildGraphForDocument(workspaceId, docId, filename, content);
   ```

2. **Add "View Knowledge Graph" button** to workspace dashboard

3. **Enhance with LLM**:
   - Use Claude API to detect relationships
   - Auto-categorize concepts
   - Find contradictions

4. **Advanced visualization**:
   - 3D graph (Three.js)
   - Timeline view
   - Community clustering

## Troubleshooting

### "Graph not loading"
- Check browser console (F12)
- Verify workspace slug is correct
- Ensure at least one document exists
- Check that migration ran: `npx prisma db push`

### "No concepts appearing"
- Documents might be empty or images-only
- Check server logs for errors
- Try rebuilding: `POST /knowledge-graph/rebuild`

### "API 404 errors"
- Ensure server restarted after changes
- Check endpoint registration
- Verify files are in correct paths

### "D3 not rendering"
- Verify `npm install d3` ran in frontend
- Check that SVG ref is being set
- Look for JavaScript errors in console

## Performance Notes

- **Graphs up to 500 nodes**: Smooth (all browsers)
- **500-1000 nodes**: Good (Chrome recommended)
- **1000+ nodes**: Consider filtering or clustering

For large workspaces, use:
- Relationship type filter
- Search to focus view
- Export and analyze separately

## Architecture Quick Reference

```
Workspace
  ├─ Documents (from existing workspace_documents)
  ├─ Knowledge Graph Nodes
  │   ├─ Document nodes (1 per document)
  │   └─ Concept nodes (extracted from documents)
  └─ Knowledge Graph Edges
      ├─ mentions (concept → document)
      ├─ related (document ↔ document)
      ├─ similar (concept ↔ concept)
      ├─ contradicts (concept ↔ concept)
      └─ references (document ↔ document)
```

## API Reference Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/knowledge-graph` | Get full graph |
| GET | `/knowledge-graph/stats` | Get statistics |
| GET | `/knowledge-graph/nodes` | Get all nodes |
| GET | `/knowledge-graph/edges` | Get all edges |
| GET | `/knowledge-graph/search?q=...` | Search nodes |
| GET | `/knowledge-graph/node/:id` | Get node details |
| POST | `/knowledge-graph/rebuild` | Rebuild graph |
| POST | `/knowledge-graph/node` | Create node |
| POST | `/knowledge-graph/edge` | Create edge |
| PUT | `/knowledge-graph/edge/:id` | Update edge |
| DELETE | `/knowledge-graph/node/:id` | Delete node |
| GET | `/knowledge-graph/export` | Export as JSON |

---

**Status**: Ready to integrate ✓
**Lines of Code**: ~1,200
**Dependencies**: D3.js, Prisma
**Setup Time**: 5 minutes
