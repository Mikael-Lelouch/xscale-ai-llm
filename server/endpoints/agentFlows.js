const { AgentFlows } = require("../utils/agentFlows");
const { AgentFlowExecution } = require("../models/agentFlowExecution");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { Telemetry } = require("../models/telemetry");
const { safeJSONStringify } = require("../utils/helpers/chat/responses");

function agentFlowEndpoints(app) {
  if (!app) return;

  // Save a flow configuration
  app.post(
    "/agent-flows/save",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { name, config, uuid } = request.body;

        if (!name || !config) {
          return response.status(400).json({
            success: false,
            error: "Name and config are required",
          });
        }

        const flow = AgentFlows.saveFlow(name, config, uuid);
        if (!flow || !flow.success)
          return response
            .status(200)
            .json({ flow: null, error: flow.error || "Failed to save flow" });

        if (!uuid) {
          await Telemetry.sendTelemetry("agent_flow_created", {
            blockCount: config.blocks?.length || 0,
          });
        }

        return response.status(200).json({
          success: true,
          flow,
        });
      } catch (error) {
        console.error("Error saving flow:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // List all available flows
  app.get(
    "/agent-flows/list",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (_request, response) => {
      try {
        const flows = AgentFlows.listFlows();
        return response.status(200).json({
          success: true,
          flows,
        });
      } catch (error) {
        console.error("Error listing flows:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get a specific flow by UUID
  app.get(
    "/agent-flows/:uuid",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { uuid } = request.params;
        const flow = AgentFlows.loadFlow(uuid);
        if (!flow) {
          return response.status(404).json({
            success: false,
            error: "Flow not found",
          });
        }

        return response.status(200).json({
          success: true,
          flow,
        });
      } catch (error) {
        console.error("Error getting flow:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Run a specific flow
  app.post(
    "/agent-flows/:uuid/run",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      let executionId = null;
      try {
        const { uuid } = request.params;
        const { variables = {} } = request.body;
        const userId = request.user?.id || null;

        // Load the flow
        const flow = AgentFlows.loadFlow(uuid);
        if (!flow) {
          return response.status(404).json({
            success: false,
            error: "Flow not found",
          });
        }

        // Check if flow is active
        if (flow.config.active === false) {
          return response.status(400).json({
            success: false,
            error: "Flow is not active",
          });
        }

        // Start execution record
        const executionResult = await AgentFlowExecution.startExecution(
          uuid,
          flow.name,
          variables,
          userId
        );
        if (!executionResult.success) {
          return response.status(500).json({
            success: false,
            error: "Failed to start execution",
          });
        }

        executionId = executionResult.executionId;

        // Set up SSE response headers
        response.setHeader("Content-Type", "text/event-stream");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("Access-Control-Allow-Origin", "*");

        // Track if client disconnects
        let clientDisconnected = false;
        response.on("close", () => {
          clientDisconnected = true;
          if (executionId) {
            AgentFlowExecution.updateStatus(executionId, "aborted");
          }
        });

        // Helper to write SSE chunks
        const writeChunk = (data) => {
          if (!clientDisconnected) {
            try {
              response.write(`data: ${safeJSONStringify(data)}\n\n`);
            } catch (err) {
              console.error("Failed to write chunk:", err);
            }
          }
        };

        // Execute flow with streaming
        const { FlowExecutor } = require("../utils/agentFlows/executor");
        const flowExecutor = new FlowExecutor();

        // Attach execution context with streaming callback
        flowExecutor.attachExecutionContext(executionId, writeChunk);

        // Execute the flow
        const result = await flowExecutor.executeFlowWithStreaming(
          flow,
          variables,
          null, // aibitat instance (not available in REST context)
          executionId,
          writeChunk
        );

        // Finalize execution in database
        await AgentFlowExecution.finalizeExecution(
          executionId,
          result.success,
          result.results,
          result.success ? null : "Execution completed with errors",
          {
            directOutput: !!result.directOutput,
            stepCount: flow.config.steps.length,
          }
        );

        // Send final response
        writeChunk({
          id: executionId,
          type: "executionComplete",
          success: result.success,
          results: result.results,
          variables: result.variables,
          directOutput: result.directOutput,
          timestamp: new Date().toISOString(),
          close: true,
        });

        // Send telemetry
        await Telemetry.sendTelemetry("agent_flow_executed", {
          flowUuid: uuid,
          variableCount: Object.keys(variables).length,
          stepCount: flow.config.steps.length,
          success: result.success,
          executionTimeMs: Date.now() - executionResult.execution.startedAt,
        });

        response.end();
      } catch (error) {
        console.error("Error running flow:", error);

        // Update execution with error if it was started
        if (executionId) {
          await AgentFlowExecution.finalizeExecution(
            executionId,
            false,
            [],
            error.message
          );
        }

        // Send error response
        if (!response.headersSent) {
          return response.status(500).json({
            success: false,
            error: error.message,
          });
        } else {
          // If headers were sent, write error as SSE
          try {
            response.write(
              `data: ${safeJSONStringify({
                type: "executionError",
                error: error.message,
                close: true,
              })}\n\n`
            );
          } catch (err) {
            console.error("Failed to send error chunk:", err);
          }
          response.end();
        }
      }
    }
  );

  // Get execution history for a flow
  app.get(
    "/agent-flows/:uuid/executions",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { uuid } = request.params;
        const { limit = 50, offset = 0 } = request.query;

        const executions = await AgentFlowExecution.listExecutions(
          uuid,
          parseInt(limit),
          parseInt(offset)
        );

        const stats = await AgentFlowExecution.getExecutionStats(uuid);

        return response.status(200).json({
          success: true,
          executions,
          stats,
        });
      } catch (error) {
        console.error("Error getting execution history:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get a specific execution
  app.get(
    "/agent-flows/execution/:executionId",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { executionId } = request.params;
        const execution = await AgentFlowExecution.getExecution(
          parseInt(executionId)
        );

        if (!execution) {
          return response.status(404).json({
            success: false,
            error: "Execution not found",
          });
        }

        return response.status(200).json({
          success: true,
          execution,
        });
      } catch (error) {
        console.error("Error getting execution:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Delete a specific flow
  app.delete(
    "/agent-flows/:uuid",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { uuid } = request.params;
        const { success } = AgentFlows.deleteFlow(uuid);

        if (!success) {
          return response.status(500).json({
            success: false,
            error: "Failed to delete flow",
          });
        }

        return response.status(200).json({
          success,
        });
      } catch (error) {
        console.error("Error deleting flow:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Toggle flow active status
  app.post(
    "/agent-flows/:uuid/toggle",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { uuid } = request.params;
        const { active } = request.body;

        const flow = AgentFlows.loadFlow(uuid);
        if (!flow) {
          return response
            .status(404)
            .json({ success: false, error: "Flow not found" });
        }

        flow.config.active = active;
        const { success } = AgentFlows.saveFlow(flow.name, flow.config, uuid);

        if (!success) {
          return response
            .status(500)
            .json({ success: false, error: "Failed to update flow" });
        }

        return response.json({ success: true, flow });
      } catch (error) {
        console.error("Error toggling flow:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );
}

module.exports = { agentFlowEndpoints };
