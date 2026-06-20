const prisma = require("../utils/prisma");
const { safeJsonParse } = require("../utils/http");

class AgentFlowExecution {
  /**
   * Start a new flow execution
   * @param {string} flowUuid - The UUID of the flow being executed
   * @param {string} flowName - The display name of the flow
   * @param {Object} variables - Initial input variables
   * @param {number} userId - The ID of the user executing the flow
   * @returns {Promise<Object>} Execution record with id
   */
  static async startExecution(flowUuid, flowName, variables = {}, userId = null) {
    try {
      const execution = await prisma.agent_flow_executions.create({
        data: {
          flowUuid,
          flowName,
          status: "running",
          variables: JSON.stringify(variables),
          createdBy: userId,
        },
      });
      return { success: true, executionId: execution.id, execution };
    } catch (error) {
      console.error("Failed to start execution:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update the status and results of an execution
   * @param {number} executionId - The execution ID
   * @param {string} status - New status (running, completed, failed, aborted)
   * @param {Array} results - Array of step results
   * @param {string} error - Optional error message
   * @returns {Promise<Object>} Updated execution record
   */
  static async updateStatus(
    executionId,
    status,
    results = null,
    error = null
  ) {
    try {
      const updateData = { status, lastUpdatedAt: new Date() };

      if (results !== null) {
        updateData.results = JSON.stringify(results);
      }

      if (error !== null) {
        updateData.error = error;
      }

      if (status === "completed" || status === "failed" || status === "aborted") {
        updateData.completedAt = new Date();
      }

      const execution = await prisma.agent_flow_executions.update({
        where: { id: executionId },
        data: updateData,
      });

      return { success: true, execution };
    } catch (error) {
      console.error("Failed to update execution status:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a specific execution by ID
   * @param {number} executionId - The execution ID
   * @returns {Promise<Object>} Execution record with parsed data
   */
  static async getExecution(executionId) {
    try {
      const execution = await prisma.agent_flow_executions.findUnique({
        where: { id: executionId },
        include: { user: { select: { id: true, username: true } } },
      });

      if (!execution) return null;

      return {
        ...execution,
        variables: safeJsonParse(execution.variables, {}),
        results: safeJsonParse(execution.results, []),
        metadata: safeJsonParse(execution.metadata, {}),
      };
    } catch (error) {
      console.error("Failed to get execution:", error);
      return null;
    }
  }

  /**
   * List executions for a specific flow
   * @param {string} flowUuid - The flow UUID
   * @param {number} limit - Number of results to return
   * @param {number} offset - Pagination offset
   * @returns {Promise<Array>} Array of execution records
   */
  static async listExecutions(flowUuid, limit = 50, offset = 0) {
    try {
      const executions = await prisma.agent_flow_executions.findMany({
        where: { flowUuid },
        include: { user: { select: { id: true, username: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      return executions.map((exec) => ({
        ...exec,
        variables: safeJsonParse(exec.variables, {}),
        results: safeJsonParse(exec.results, []),
        metadata: safeJsonParse(exec.metadata, {}),
      }));
    } catch (error) {
      console.error("Failed to list executions:", error);
      return [];
    }
  }

  /**
   * Get execution statistics for a flow
   * @param {string} flowUuid - The flow UUID
   * @returns {Promise<Object>} Statistics object
   */
  static async getExecutionStats(flowUuid) {
    try {
      const executions = await prisma.agent_flow_executions.findMany({
        where: { flowUuid },
        select: { status: true, completedAt: true, startedAt: true },
      });

      const stats = {
        total: executions.length,
        completed: executions.filter((e) => e.status === "completed").length,
        failed: executions.filter((e) => e.status === "failed").length,
        running: executions.filter((e) => e.status === "running").length,
        aborted: executions.filter((e) => e.status === "aborted").length,
      };

      // Calculate average execution time
      const completedWithTime = executions.filter(
        (e) => e.status === "completed" && e.completedAt && e.startedAt
      );
      if (completedWithTime.length > 0) {
        const avgTime =
          completedWithTime.reduce(
            (sum, e) => sum + (e.completedAt - e.startedAt),
            0
          ) / completedWithTime.length;
        stats.averageExecutionTimeMs = Math.round(avgTime);
      }

      return stats;
    } catch (error) {
      console.error("Failed to get execution stats:", error);
      return {};
    }
  }

  /**
   * Finalize an execution (mark as completed or failed)
   * @param {number} executionId - The execution ID
   * @param {boolean} success - Whether execution succeeded
   * @param {Array} results - Step results
   * @param {string} error - Optional error message
   * @param {Object} metadata - Optional metadata to store
   * @returns {Promise<Object>} Updated execution record
   */
  static async finalizeExecution(
    executionId,
    success,
    results,
    error = null,
    metadata = null
  ) {
    try {
      const status = success ? "completed" : "failed";
      const updateData = {
        status,
        results: JSON.stringify(results),
        completedAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      if (error) {
        updateData.error = error;
      }

      if (metadata) {
        updateData.metadata = JSON.stringify(metadata);
      }

      const execution = await prisma.agent_flow_executions.update({
        where: { id: executionId },
        data: updateData,
        include: { user: { select: { id: true, username: true } } },
      });

      return {
        success: true,
        execution: {
          ...execution,
          variables: safeJsonParse(execution.variables, {}),
          results: safeJsonParse(execution.results, []),
          metadata: safeJsonParse(execution.metadata, {}),
        },
      };
    } catch (error) {
      console.error("Failed to finalize execution:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up old executions (retention policy)
   * @param {string} flowUuid - The flow UUID (optional)
   * @param {number} retentionDays - Keep executions from last N days
   * @returns {Promise<Object>} Deletion result
   */
  static async cleanupOldExecutions(
    flowUuid = null,
    retentionDays = 30
  ) {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const where = { createdAt: { lt: cutoffDate } };
      if (flowUuid) {
        where.flowUuid = flowUuid;
      }

      const result = await prisma.agent_flow_executions.deleteMany({
        where,
      });

      return { success: true, deletedCount: result.count };
    } catch (error) {
      console.error("Failed to cleanup executions:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = { AgentFlowExecution };
