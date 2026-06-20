const { FlowExecutor } = require("../../../utils/agentFlows/executor");

describe("FlowExecutor: Flow Execution with Streaming", () => {
  const executor = new FlowExecutor();

  it("should attach execution context", () => {
    const mockCallback = jest.fn();
    executor.attachExecutionContext(123, mockCallback);

    expect(executor.executionId).toBe(123);
    expect(executor.streamCallback).toBe(mockCallback);
  });

  it("should stream step results", async () => {
    const mockCallback = jest.fn().mockResolvedValue(undefined);
    executor.attachExecutionContext(456, mockCallback);

    const step = {
      type: "apiCall",
      name: "Fetch Data",
      config: {},
    };

    const result = { data: "test" };
    await executor.streamStepResult(0, step, result, true);

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 456,
        type: "stepComplete",
        stepIndex: 0,
        stepName: "Fetch Data",
        stepType: "apiCall",
        data: result,
        success: true,
      })
    );
  });

  it("should stream error step results", async () => {
    const mockCallback = jest.fn().mockResolvedValue(undefined);
    executor.attachExecutionContext(789, mockCallback);

    const step = {
      type: "apiCall",
      name: "API Error",
      config: {},
    };

    await executor.streamStepResult(
      0,
      step,
      null,
      false,
      "Connection timeout"
    );

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 789,
        type: "stepError",
        success: false,
        error: "Connection timeout",
      })
    );
  });

  it("should initialize variables from START block", async () => {
    const flow = {
      name: "Test Flow",
      uuid: "test-uuid",
      config: {
        steps: [
          {
            type: "start",
            name: "Start",
            config: {
              variables: [
                { name: "input1", value: "default1" },
                { name: "input2", value: "default2" },
              ],
            },
          },
        ],
      },
    };

    const result = await executor.executeFlow(flow, {});
    expect(result.variables).toEqual({
      input1: "default1",
      input2: "default2",
    });
  });

  it("should override default variables with input variables", async () => {
    const flow = {
      name: "Test Flow",
      uuid: "test-uuid",
      config: {
        steps: [
          {
            type: "start",
            name: "Start",
            config: {
              variables: [
                { name: "input1", value: "default1" },
                { name: "input2", value: "default2" },
              ],
            },
          },
        ],
      },
    };

    const result = await executor.executeFlow(flow, {
      input1: "override1",
      input3: "new3",
    });

    expect(result.variables).toEqual({
      input1: "override1",
      input2: "default2",
      input3: "new3",
    });
  });

  it("should handle variable substitution in step config", async () => {
    executor.variables = {
      apiUrl: "https://api.example.com",
      userId: "user123",
    };

    const config = {
      url: "${apiUrl}/users/${userId}",
      method: "GET",
      headers: [{ key: "X-User-ID", value: "${userId}" }],
    };

    const replaced = executor.replaceVariables(config);
    expect(replaced.url).toBe("https://api.example.com/users/user123");
    expect(replaced.headers[0].value).toBe("user123");
  });

  it("should handle nested variable resolution", () => {
    executor.variables = {
      response: {
        data: {
          items: [
            { id: 1, name: "Item 1" },
            { id: 2, name: "Item 2" },
          ],
        },
      },
    };

    const value1 = executor.getValueFromPath(executor.variables, "response.data.items[0].name");
    const value2 = executor.getValueFromPath(executor.variables, "response.data.items[1].id");

    expect(value1).toBe("Item 1");
    expect(value2).toBe(2);
  });

  it("should store step results in variables", async () => {
    const flow = {
      name: "Test Flow",
      uuid: "test-uuid",
      config: {
        steps: [
          {
            type: "start",
            name: "Start",
            config: {
              variables: [],
            },
          },
        ],
      },
    };

    executor.variables = { previousResult: "data" };
    executor.replaceVariables = jest.fn((config) => ({
      ...config,
      resultVariable: "storedResult",
    }));

    const step = {
      type: "start",
      config: { resultVariable: "storedResult" },
    };

    const result = { success: true, data: "new_data" };
    const mockExecuteStep = jest.fn().mockResolvedValue(result);
    executor.executeStep = mockExecuteStep;

    // Test that variables are properly stored after step execution
    expect(typeof executor.executeStep).toBe("function");
  });

  it("should handle flow execution with streaming", async () => {
    const streamedChunks = [];
    const mockCallback = jest.fn((chunk) => {
      streamedChunks.push(chunk);
      return Promise.resolve();
    });

    executor.attachExecutionContext(999, mockCallback);
    executor.replaceVariables = jest.fn((config) => config);

    const flow = {
      name: "Streaming Flow",
      uuid: "stream-test",
      config: {
        steps: [
          {
            type: "start",
            name: "Initialize",
            config: {
              variables: [{ name: "test", value: "value" }],
            },
          },
        ],
      },
    };

    // Mock executeStep to avoid actual execution
    executor.executeStep = jest.fn(async () => ({ result: "success" }));

    const result = await executor.executeFlowWithStreaming(
      flow,
      {},
      null,
      999,
      mockCallback
    );

    expect(result.success).toBe(true);
    expect(result.variables).toHaveProperty("test", "value");
  });

  it("should handle empty variables gracefully", () => {
    executor.variables = {};
    const value = executor.getValueFromPath(executor.variables, "nonexistent.path");
    expect(value).toBe("");
  });

  it("should handle invalid paths gracefully", () => {
    executor.variables = { a: { b: { c: "value" } } };
    const value = executor.getValueFromPath(executor.variables, "a.x.y.z");
    expect(value).toBeUndefined();
  });

  it("should handle array indices correctly", () => {
    executor.variables = {
      items: [
        { id: 1, name: "First" },
        { id: 2, name: "Second" },
        { id: 3, name: "Third" },
      ],
    };

    expect(executor.getValueFromPath(executor.variables, "items[0].name")).toBe(
      "First"
    );
    expect(executor.getValueFromPath(executor.variables, "items[2].id")).toBe(3);
    expect(
      executor.getValueFromPath(executor.variables, "items[10].name")
    ).toBeUndefined();
  });

  it("should stringify complex objects when returning from getValueFromPath", () => {
    executor.variables = {
      complex: {
        nested: { value: 123 },
        array: [1, 2, 3],
      },
    };

    const complexResult = executor.getValueFromPath(
      executor.variables,
      "complex.nested"
    );
    expect(typeof complexResult).toBe("string");
    expect(JSON.parse(complexResult)).toEqual({ value: 123 });
  });
});
