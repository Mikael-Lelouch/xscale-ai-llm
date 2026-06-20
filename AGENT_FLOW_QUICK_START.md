# Agent Flow Execution Engine - Quick Start Guide

## What Was Implemented

The Agent Flow Execution Engine is a complete runtime system for executing automated workflows defined in the UI. It enables:

- Creating multi-step workflows with the visual builder
- Executing workflows with input variables
- Real-time streaming results back to the UI
- Storing execution history in the database
- Debugging workflow execution with step-by-step logs

## Quick Setup

### 1. Run Database Migration

```bash
cd server
npx prisma migrate dev --name add_agent_flow_executions
```

This creates the `agent_flow_executions` table for storing execution history.

### 2. Start the Server

```bash
yarn dev
```

The API endpoints will be available at `/api/agent-flows/`.

## Creating Your First Flow

### Step 1: Create a Flow via UI

1. Go to Settings → Agent Flows → Create New Flow
2. Give it a name, e.g., "Weather Lookup"
3. Add blocks:
   - **START block**: Initialize variables (e.g., `city` = "San Francisco")
   - **API_CALL block**: Call weather API with `${city}` variable
   - **LLM_INSTRUCTION block**: Parse response using LLM

### Step 2: Execute via API

```bash
curl -X POST http://localhost:3001/api/agent-flows/abc-123-uuid/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"variables": {"city": "New York"}}'
```

### Step 3: Handle Streaming Response

The response streams Server-Sent Events:

```javascript
// JavaScript
const eventSource = new EventSource(
  'http://localhost:3001/api/agent-flows/abc-123-uuid/run',
  { method: 'POST', body: JSON.stringify({variables: {}}) }
);

eventSource.onmessage = (event) => {
  const chunk = JSON.parse(event.data);
  console.log(`${chunk.stepType} - ${chunk.stepName}: `, chunk.data);
};
```

Or use the frontend model:

```javascript
import AgentFlows from '@/models/agentFlows';

AgentFlows.runFlow(flowUuid, {city: 'Boston'}, (chunk) => {
  console.log(chunk);
});
```

## Variable System

Variables are available throughout the flow execution:

### 1. Define Default Variables (START block)
```javascript
{
  "type": "start",
  "config": {
    "variables": [
      { "name": "apiKey", "value": "default_key" },
      { "name": "timeout", "value": "30" }
    ]
  }
}
```

### 2. Override at Execution Time
```javascript
AgentFlows.runFlow(uuid, {
  apiKey: "user_key_123",  // Overrides default
  timeout: "60"             // Overrides default
});
```

### 3. Reference Variables in Steps
```javascript
{
  "type": "apiCall",
  "config": {
    "url": "https://api.example.com/data",
    "headers": [
      { "key": "X-API-Key", "value": "${apiKey}" },
      { "key": "X-Timeout", "value": "${timeout}" }
    ],
    "resultVariable": "apiResponse"  // Store result
  }
}
```

### 4. Use Nested Paths
```javascript
{
  "type": "llmInstruction",
  "config": {
    // apiResponse is a JSON object from previous step
    "instruction": "Summarize: ${apiResponse.data.summary}",
    "resultVariable": "summary"
  }
}
```

Supported path syntax:
- Simple: `${variable}`
- Nested: `${object.property.nested}`
- Array index: `${array[0]}`
- Array of objects: `${array[0].property}`
- Combination: `${data.items[2].users[0].name}`

## Execution Flow

```
User clicks "Run Flow"
         ↓
Frontend sends POST /api/agent-flows/:uuid/run
         ↓
Server starts execution (creates database record)
         ↓
For each step:
  1. Replace variables in config
  2. Execute step (API call, LLM, etc.)
  3. Store result in variable if specified
  4. Stream result chunk to client
  5. On error: stop and stream error
         ↓
Server finalizes execution record
         ↓
Send executionComplete event with close: true
         ↓
Client closes connection
```

## Step Types Reference

### START
Initialize variables for the workflow.

```javascript
{
  "type": "start",
  "name": "Initialize Variables",
  "config": {
    "variables": [
      { "name": "userInput", "value": "" },
      { "name": "apiKey", "value": "sk-..." }
    ]
  }
}
```

### API_CALL
Make HTTP requests.

```javascript
{
  "type": "apiCall",
  "name": "Fetch User Data",
  "config": {
    "url": "https://api.example.com/users/${userId}",
    "method": "GET",
    "headers": [
      { "key": "Authorization", "value": "Bearer ${apiKey}" }
    ],
    "resultVariable": "userData"
  }
}
```

### LLM_INSTRUCTION
Send instructions to the LLM.

```javascript
{
  "type": "llmInstruction",
  "name": "Analyze Data",
  "config": {
    "instruction": "Analyze this data and provide 3 key insights:\n\n${userData}",
    "resultVariable": "analysis"
  }
}
```

### WEB_SCRAPING
Fetch and parse web content.

```javascript
{
  "type": "webScraping",
  "name": "Scrape Documentation",
  "config": {
    "url": "https://docs.example.com",
    "captureAs": "text",  // text | html | querySelector
    "enableSummarization": true,
    "resultVariable": "docs"
  }
}
```

## Monitoring Execution

### View Execution History

```bash
curl http://localhost:3001/api/agent-flows/abc-123-uuid/executions
```

Response:
```json
{
  "success": true,
  "executions": [
    {
      "id": 1,
      "flowUuid": "abc-123-uuid",
      "flowName": "Weather Lookup",
      "status": "completed",
      "startedAt": "2026-06-20T12:00:00Z",
      "completedAt": "2026-06-20T12:00:05Z",
      "variables": {"city": "New York"},
      "results": [{...}, {...}],
      "error": null
    }
  ],
  "stats": {
    "total": 25,
    "completed": 23,
    "failed": 2,
    "running": 0,
    "averageExecutionTimeMs": 4500
  }
}
```

### View Specific Execution

```bash
curl http://localhost:3001/api/agent-flows/execution/1
```

Response includes full details of step-by-step execution.

## Common Patterns

### Pattern 1: Data Enrichment Pipeline

1. START: Initialize user ID
2. API_CALL: Fetch user from database
3. API_CALL: Fetch user's recent activity
4. LLM_INSTRUCTION: Generate personalized recommendations
5. API_CALL: Store recommendations back to database

```javascript
const flow = {
  name: "Personalize User",
  steps: [
    {
      type: "start",
      config: {
        variables: [{ name: "userId", value: "" }]
      }
    },
    {
      type: "apiCall",
      config: {
        url: "https://api.example.com/users/${userId}",
        method: "GET",
        resultVariable: "user"
      }
    },
    {
      type: "apiCall",
      config: {
        url: "https://api.example.com/users/${user.id}/activity",
        method: "GET",
        resultVariable: "activity"
      }
    },
    {
      type: "llmInstruction",
      config: {
        instruction: "Based on this user profile and activity, suggest 3 recommendations:\n\nProfile: ${user}\n\nActivity: ${activity}",
        resultVariable: "recommendations"
      }
    }
  ]
};
```

### Pattern 2: Content Processing

1. START: Initialize content URL
2. WEB_SCRAPING: Fetch content
3. LLM_INSTRUCTION: Extract key information
4. API_CALL: Store results

```javascript
const flow = {
  name: "Process Article",
  steps: [
    { type: "start", config: { variables: [{ name: "url", value: "" }] } },
    { type: "webScraping", config: { url: "${url}", resultVariable: "content" } },
    { type: "llmInstruction", config: { instruction: "Summarize this article in 3 bullet points:\n\n${content}", resultVariable: "summary" } },
    { type: "apiCall", config: { url: "https://api.example.com/articles", method: "POST", body: JSON.stringify({content: "${content}", summary: "${summary}"}), resultVariable: "saved" } }
  ]
};
```

### Pattern 3: Multi-API Orchestration

1. START: Initialize search query
2. API_CALL: Search service A
3. API_CALL: Search service B
4. API_CALL: Search service C
5. LLM_INSTRUCTION: Merge and rank results

```javascript
const flow = {
  name: "Multi-Service Search",
  steps: [
    { type: "start", config: { variables: [{ name: "query", value: "" }] } },
    { type: "apiCall", config: { url: "https://service-a.com/search?q=${query}", resultVariable: "resultsA" } },
    { type: "apiCall", config: { url: "https://service-b.com/search?q=${query}", resultVariable: "resultsB" } },
    { type: "apiCall", config: { url: "https://service-c.com/search?q=${query}", resultVariable: "resultsC" } },
    { type: "llmInstruction", config: { instruction: "Combine and rank these search results:\n\nService A: ${resultsA}\n\nService B: ${resultsB}\n\nService C: ${resultsC}", resultVariable: "rankedResults" } }
  ]
};
```

## Error Handling

When a step fails:

1. Error is caught in the executor
2. Execution stops (no further steps run)
3. `AgentFlowExecution` record marked as "failed"
4. Error message stored in database
5. Client receives `stepError` and `executionComplete` events

```javascript
// Client-side
AgentFlows.runFlow(uuid, inputs, (chunk) => {
  if (chunk.type === "stepError") {
    console.error(`Step "${chunk.stepName}" failed: ${chunk.error}`);
    // Handle error gracefully
  } else if (chunk.type === "executionComplete" && !chunk.success) {
    console.error("Workflow failed to complete");
  }
});
```

## Debugging Tips

1. **Check browser console** for SSE parsing errors
2. **Check server logs** for execution errors
3. **Query database** for execution history:
   ```sql
   SELECT * FROM agent_flow_executions 
   WHERE flowUuid = 'abc-123' 
   ORDER BY createdAt DESC 
   LIMIT 10;
   ```
4. **Check variables** at each step:
   ```javascript
   // In streaming response, each chunk includes current variables
   console.log(chunk.variables); // Shows all variables after this step
   ```

## Next Steps

1. **Create a flow** via the UI
2. **Test execution** via curl or frontend
3. **Check results** in the execution history
4. **Iterate** based on execution feedback

For more details, see `AGENT_FLOW_EXECUTION_IMPLEMENTATION.md`.
