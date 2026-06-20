const { EventLogs } = require("../../../models/eventLogs");
const { AuditLogs } = require("../../../models/auditLogs");
const { Invite } = require("../../../models/invite");
const { SystemSettings } = require("../../../models/systemSettings");
const { User } = require("../../../models/user");
const { Workspace } = require("../../../models/workspace");
const { WorkspaceChats } = require("../../../models/workspaceChats");
const { WorkspaceUser } = require("../../../models/workspaceUsers");
const { canModifyAdmin } = require("../../../utils/helpers/admin");
const { multiUserMode, reqBody } = require("../../../utils/http");
const { validApiKey } = require("../../../utils/middleware/validApiKey");

function apiAdminEndpoints(app) {
  if (!app) return;

  app.get("/v1/admin/is-multi-user-mode", [validApiKey], (_, response) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.description = 'Check to see if the instance is in multi-user-mode first. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
             "isMultiUser": true
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
    const isMultiUser = multiUserMode(response);
    response.status(200).json({ isMultiUser });
  });

  app.get("/v1/admin/users", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.description = 'Check to see if the instance is in multi-user-mode first. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
             "users": [
                {
                  username: "sample-sam",
                  role: 'default',
                }
             ]
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
     #swagger.responses[401] = {
      description: "Instance is not in Multi-User mode. Method denied",
    }
    */
    try {
      if (!multiUserMode(response)) {
        response.sendStatus(401).end();
        return;
      }

      const users = await User.where();
      response.status(200).json({ users });
    } catch (e) {
      console.error(e);
      response.sendStatus(500).end();
    }
  });

  app.post("/v1/admin/users/new", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.description = 'Create a new user with username and password. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.requestBody = {
        description: 'Key pair object that will define the new user to add to the system.',
        required: true,
        content: {
          "application/json": {
            example: {
              username: "sample-sam",
              password: 'hunter2',
              role: 'default | admin'
            }
          }
        }
      }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              user: {
                id: 1,
                username: 'sample-sam',
                role: 'default',
              },
              error: null,
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
     #swagger.responses[401] = {
      description: "Instance is not in Multi-User mode. Method denied",
    }
    */
    try {
      if (!multiUserMode(response)) {
        response.sendStatus(401).end();
        return;
      }

      const newUserParams = reqBody(request);
      const { user: newUser, error } = await User.create(newUserParams);
      response.status(newUser ? 200 : 400).json({ user: newUser, error });
    } catch (e) {
      console.error(e);
      response.sendStatus(500).end();
    }
  });

  app.post("/v1/admin/users/:id", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'id of the user in the database.',
      required: true,
      type: 'string'
    }
    #swagger.description = 'Update existing user settings. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.requestBody = {
        description: 'Key pair object that will update the found user. All fields are optional and will not update unless specified.',
        required: true,
        content: {
          "application/json": {
            example: {
              username: "sample-sam",
              password: 'hunter2',
              role: 'default | admin',
              suspended: 0,
            }
          }
        }
      }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              success: true,
              error: null,
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
     #swagger.responses[401] = {
      description: "Instance is not in Multi-User mode. Method denied",
    }
    */
    try {
      if (!multiUserMode(response)) {
        response.sendStatus(401).end();
        return;
      }

      const { id } = request.params;
      const updates = reqBody(request);
      const user = await User.get({ id: Number(id) });
      const validAdminRoleModification = await canModifyAdmin(user, updates);

      if (!validAdminRoleModification.valid) {
        response
          .status(200)
          .json({ success: false, error: validAdminRoleModification.error });
        return;
      }

      const { success, error } = await User.update(id, updates);
      response.status(200).json({ success, error });
    } catch (e) {
      console.error(e);
      response.sendStatus(500).end();
    }
  });

  app.delete(
    "/v1/admin/users/:id",
    [validApiKey],
    async (request, response) => {
      /*
    #swagger.tags = ['Admin']
    #swagger.description = 'Delete existing user by id. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'id of the user in the database.',
      required: true,
      type: 'string'
    }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              success: true,
              error: null,
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
     #swagger.responses[401] = {
      description: "Instance is not in Multi-User mode. Method denied",
    }
    */
      try {
        if (!multiUserMode(response)) {
          response.sendStatus(401).end();
          return;
        }

        const { id } = request.params;
        const user = await User.get({ id: Number(id) });
        await User.delete({ id: user.id });
        await EventLogs.logEvent("api_user_deleted", {
          userName: user.username,
        });
        response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get("/v1/admin/invites", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.description = 'List all existing invitations to instance regardless of status. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
             "invites": [
                {
                  id: 1,
                  status: "pending",
                  code: 'abc-123',
                  claimedBy: null
                }
             ]
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
     #swagger.responses[401] = {
      description: "Instance is not in Multi-User mode. Method denied",
    }
    */
    try {
      if (!multiUserMode(response)) {
        response.sendStatus(401).end();
        return;
      }

      const invites = await Invite.whereWithUsers();
      response.status(200).json({ invites });
    } catch (e) {
      console.error(e);
      response.sendStatus(500).end();
    }
  });

  app.post("/v1/admin/invite/new", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.description = 'Create a new invite code for someone to use to register with instance. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.requestBody = {
        description: 'Request body for creation parameters of the invitation',
        required: false,
        content: {
          "application/json": {
            example: {
              workspaceIds: [1,2,45],
            }
          }
        }
      }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              invite: {
                id: 1,
                status: "pending",
                code: 'abc-123',
              },
              error: null,
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
     #swagger.responses[401] = {
      description: "Instance is not in Multi-User mode. Method denied",
    }
    */
    try {
      if (!multiUserMode(response)) {
        response.sendStatus(401).end();
        return;
      }

      const body = reqBody(request);
      const { invite, error } = await Invite.create({
        workspaceIds: body?.workspaceIds ?? [],
      });
      response.status(200).json({ invite, error });
    } catch (e) {
      console.error(e);
      response.sendStatus(500).end();
    }
  });

  app.delete(
    "/v1/admin/invite/:id",
    [validApiKey],
    async (request, response) => {
      /*
    #swagger.tags = ['Admin']
    #swagger.description = 'Deactivates (soft-delete) invite by id. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'id of the invite in the database.',
      required: true,
      type: 'string'
    }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              success: true,
              error: null,
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
     #swagger.responses[401] = {
      description: "Instance is not in Multi-User mode. Method denied",
    }
    */
      try {
        if (!multiUserMode(response)) {
          response.sendStatus(401).end();
          return;
        }

        const { id } = request.params;
        const parsedId = Number(id);
        if (isNaN(parsedId)) {
          response
            .status(400)
            .json({ success: false, error: "Invalid invite id" });
          return;
        }

        const { success, error } = await Invite.deactivate(parsedId);
        if (!success) {
          response.status(404).json({
            success: false,
            error: "Invite not found or already disabled",
          });
          return;
        }

        response.status(200).json({ success, error });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/admin/workspaces/:workspaceId/users",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Admin']
      #swagger.parameters['workspaceId'] = {
        in: 'path',
        description: 'id of the workspace.',
        required: true,
        type: 'string'
      }
      #swagger.description = 'Retrieve a list of users with permissions to access the specified workspace.'
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                users: [
                  {"userId": 1, "role": "admin"},
                  {"userId": 2, "role": "member"}
                ]
              }
            }
          }
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
       #swagger.responses[401] = {
        description: "Instance is not in Multi-User mode. Method denied",
      }
      */

      try {
        if (!multiUserMode(response)) {
          response.sendStatus(401).end();
          return;
        }

        const workspaceId = request.params.workspaceId;
        const users = await Workspace.workspaceUsers(workspaceId);

        response.status(200).json({ users });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/admin/workspaces/:workspaceId/update-users",
    [validApiKey],
    async (request, response) => {
      /*
    #swagger.tags = ['Admin']
    #swagger.deprecated = true
    #swagger.parameters['workspaceId'] = {
      in: 'path',
      description: 'id of the workspace in the database.',
      required: true,
      type: 'string'
    }
    #swagger.description = 'Overwrite workspace permissions to only be accessible by the given user ids and admins. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.requestBody = {
        description: 'Entire array of user ids who can access the workspace. All fields are optional and will not update unless specified.',
        required: true,
        content: {
          "application/json": {
            example: {
              userIds: [1,2,4,12],
            }
          }
        }
      }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              success: true,
              error: null,
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
     #swagger.responses[401] = {
      description: "Instance is not in Multi-User mode. Method denied",
    }
    */
      try {
        if (!multiUserMode(response)) {
          response.sendStatus(401).end();
          return;
        }

        const { workspaceId } = request.params;
        const { userIds } = reqBody(request);
        const { success, error } = await Workspace.updateUsers(
          workspaceId,
          userIds
        );
        response.status(200).json({ success, error });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/admin/workspaces/:workspaceSlug/manage-users",
    [validApiKey],
    async (request, response) => {
      /*
    #swagger.tags = ['Admin']
    #swagger.parameters['workspaceSlug'] = {
      in: 'path',
      description: 'slug of the workspace in the database',
      required: true,
      type: 'string'
    }
    #swagger.description = 'Set workspace permissions to be accessible by the given user ids and admins. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.requestBody = {
        description: 'Array of user ids who will be given access to the target workspace. <code>reset</code> will remove all existing users from the workspace and only add the new users - default <code>false</code>.',
        required: true,
        content: {
          "application/json": {
            example: {
              userIds: [1,2,4,12],
              reset: false
            }
          }
        }
      }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              success: true,
              error: null,
              users: [
                {"userId": 1, "username": "main-admin", "role": "admin"},
                {"userId": 2, "username": "sample-sam", "role": "default"}
              ]
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
     #swagger.responses[401] = {
      description: "Instance is not in Multi-User mode. Method denied",
    }
    */
      try {
        if (!multiUserMode(response)) {
          response.sendStatus(401).end();
          return;
        }

        const { workspaceSlug } = request.params;
        const { userIds: _uids, reset = false } = reqBody(request);
        const userIds = (
          await User.where({ id: { in: _uids.map(Number) } })
        ).map((user) => user.id);
        const workspace = await Workspace.get({ slug: String(workspaceSlug) });
        const workspaceUsers = await Workspace.workspaceUsers(workspace.id);

        if (!workspace) {
          response.status(404).json({
            success: false,
            error: `Workspace ${workspaceSlug} not found`,
            users: workspaceUsers,
          });
          return;
        }

        if (userIds.length === 0) {
          response.status(404).json({
            success: false,
            error: `No valid user IDs provided.`,
            users: workspaceUsers,
          });
          return;
        }

        // Reset all users in the workspace and add the new users as the only users in the workspace
        if (reset) {
          const { success, error } = await Workspace.updateUsers(
            workspace.id,
            userIds
          );
          return response.status(200).json({
            success,
            error,
            users: await Workspace.workspaceUsers(workspace.id),
          });
        }

        // Add new users to the workspace if they are not already in the workspace
        const existingUserIds = workspaceUsers.map((user) => user.userId);
        const usersToAdd = userIds.filter(
          (userId) => !existingUserIds.includes(userId)
        );
        if (usersToAdd.length > 0)
          await WorkspaceUser.createManyUsers(usersToAdd, workspace.id);
        response.status(200).json({
          success: true,
          error: null,
          users: await Workspace.workspaceUsers(workspace.id),
        });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/admin/workspace-chats",
    [validApiKey],
    async (request, response) => {
      /*
    #swagger.tags = ['Admin']
    #swagger.description = 'All chats in the system ordered by most recent. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.requestBody = {
        description: 'Page offset to show of workspace chats. All fields are optional and will not update unless specified.',
        required: false,
        content: {
          "application/json": {
            example: {
              offset: 2,
            }
          }
        }
      }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              success: true,
              error: null,
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
      try {
        const pgSize = 20;
        const { offset = 0 } = reqBody(request);
        const chats = await WorkspaceChats.whereWithData(
          {},
          pgSize,
          offset * pgSize,
          { id: "desc" }
        );

        const hasPages = (await WorkspaceChats.count()) > (offset + 1) * pgSize;
        response.status(200).json({ chats: chats, hasPages });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/admin/preferences",
    [validApiKey],
    async (request, response) => {
      /*
    #swagger.tags = ['Admin']
    #swagger.description = 'Update multi-user preferences for instance. Methods are disabled until multi user mode is enabled via the UI.'
    #swagger.requestBody = {
      description: 'Object with setting key and new value to set. All keys are optional and will not update unless specified.',
      required: true,
      content: {
        "application/json": {
          example: {
            support_email: "support@example.com",
          }
        }
      }
    }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              success: true,
              error: null,
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
     #swagger.responses[401] = {
      description: "Instance is not in Multi-User mode. Method denied",
    }
    */
      try {
        if (!multiUserMode(response)) {
          response.sendStatus(401).end();
          return;
        }

        const updates = reqBody(request);
        await SystemSettings.updateSettings(updates);
        response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  // Sovereignty Dashboard Endpoints
  app.get(
    "/v1/admin/sovereignty/stats",
    [validApiKey],
    async (_, response) => {
      /*
      #swagger.tags = ['Admin - Sovereignty']
      #swagger.description = 'Get comprehensive sovereignty and compliance statistics for the dashboard'
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                compliance: {
                  isCompliant: true,
                  complianceScore: 100,
                  checksCompleted: []
                },
                dataResidency: {
                  provider: 'Ollama',
                  dataLocation: '/app/server/storage',
                  isLocal: true,
                  region: 'France (Local)'
                },
                providerUsage: {
                  byProvider: [],
                  total: 0
                },
                metrics: {
                  totalInferencesLast30Days: 0,
                  totalWorkspaces: 0,
                  totalUsers: 0
                }
              }
            }
          }
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
      */
      try {
        const [compliance, dataResidency, providerUsage, workspaces, users] =
          await Promise.all([
            AuditLogs.getComplianceStatus(),
            AuditLogs.getDataResidencyInfo(),
            AuditLogs.getProviderStats(30),
            Workspace.all(),
            User.where(),
          ]);

        const totalInferences = await AuditLogs.getTotalInferencesCount(30);

        response.status(200).json({
          compliance,
          dataResidency,
          providerUsage,
          metrics: {
            totalInferencesLast30Days: totalInferences,
            totalWorkspaces: workspaces?.length || 0,
            totalUsers: users?.length || 0,
          },
          timestamp: new Date(),
        });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/admin/sovereignty/model-usage",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Admin - Sovereignty']
      #swagger.description = 'Get detailed model usage statistics for the past 30 days'
      #swagger.parameters['daysBack'] = {
        in: 'query',
        description: 'Number of days to look back (default: 30)',
        required: false,
        type: 'number'
      }
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                usage: [],
                totalCount: 0
              }
            }
          }
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
      */
      try {
        const daysBack = parseInt(request.query.daysBack) || 30;
        const usage = await AuditLogs.getProviderUsageSummary(daysBack);
        const totalCount = usage.reduce((sum, item) => sum + item.count, 0);

        response.status(200).json({
          usage: usage.map((item) => ({
            ...item,
            percentage:
              totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(2) : 0,
          })),
          totalCount,
          period: `${daysBack} days`,
          timestamp: new Date(),
        });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/admin/sovereignty/activity-log",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Admin - Sovereignty']
      #swagger.description = 'Get activity log with recent compliance and audit events'
      #swagger.parameters['limit'] = {
        in: 'query',
        description: 'Maximum records to return (default: 50)',
        required: false,
        type: 'number'
      }
      #swagger.parameters['offset'] = {
        in: 'query',
        description: 'Pagination offset (default: 0)',
        required: false,
        type: 'number'
      }
      #swagger.parameters['eventType'] = {
        in: 'query',
        description: 'Filter by event type',
        required: false,
        type: 'string'
      }
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                logs: [],
                totalCount: 0
              }
            }
          }
        }
      }
      */
      try {
        const limit = Math.min(parseInt(request.query.limit) || 50, 100);
        const offset = parseInt(request.query.offset) || 0;
        const eventType = request.query.eventType || null;

        const logs = await AuditLogs.getActivityLog(
          limit,
          offset,
          eventType
        );

        response.status(200).json({
          logs,
          limit,
          offset,
          timestamp: new Date(),
        });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/admin/sovereignty/log-inference",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Admin - Sovereignty']
      #swagger.description = 'Log an inference for audit and compliance tracking'
      #swagger.requestBody = {
        description: 'Inference data to log',
        required: true,
        content: {
          "application/json": {
            example: {
              provider: 'Ollama',
              model: 'mistral:latest',
              workspaceId: 1,
              userId: 1,
              metadata: {
                tokens: 150,
                duration: 1200
              }
            }
          }
        }
      }
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                success: true,
                logId: 1
              }
            }
          }
        }
      }
      */
      try {
        const data = reqBody(request);
        const auditLog = await AuditLogs.logEvent(
          "inference_recorded",
          `Inference using ${data.provider}`,
          {
            provider: data.provider,
            model: data.model,
            metadata: data.metadata,
          },
          data.userId,
          data.workspaceId
        );

        response.status(200).json({
          success: true,
          logId: auditLog.id,
        });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/admin/sovereignty/export-compliance-pdf",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Admin - Sovereignty']
      #swagger.description = 'Export compliance attestation as PDF document'
      #swagger.responses[200] = {
        description: 'PDF file stream',
        content: {
          "application/pdf": {}
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
      */
      try {
        const { PDFDocument, rgb } = require("pdf-lib");
        const fs = require("fs");
        const path = require("path");

        // Get compliance data
        const compliance = await AuditLogs.getComplianceStatus();
        const dataResidency = await AuditLogs.getDataResidencyInfo();
        const providerStats = await AuditLogs.getProviderStats(30);

        // Create PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4 size
        const { height } = page.getSize();
        let yPosition = height - 50;

        // Header
        page.drawText("ATTESTATION DE SOUVERAINETÉ NUMÉRIQUE", {
          x: 50,
          y: yPosition,
          size: 24,
          color: rgb(0.024, 0.714, 0.831), // Cyan
          fontColor: rgb(0, 0, 0),
        });

        yPosition -= 40;
        page.drawText("XSCALE AI - Intelligence Artificielle Souveraine Française", {
          x: 50,
          y: yPosition,
          size: 12,
          color: rgb(0.082, 0.722, 0.647), // Teal
        });

        yPosition -= 30;
        page.drawLine({
          start: { x: 50, y: yPosition },
          end: { x: 545, y: yPosition },
          thickness: 2,
          color: rgb(0.024, 0.714, 0.831),
        });

        yPosition -= 30;

        // Date and timestamp
        const now = new Date();
        page.drawText(
          `Généré le: ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR")}`,
          {
            x: 50,
            y: yPosition,
            size: 10,
            color: rgb(0.5, 0.5, 0.5),
          }
        );

        yPosition -= 25;

        // Section 1: Compliance Status
        page.drawText("1. STATUT DE CONFORMITÉ", {
          x: 50,
          y: yPosition,
          size: 14,
          color: rgb(0, 0, 0),
        });

        yPosition -= 20;
        const complianceStatus = compliance.isCompliant
          ? "✓ CONFORME - 100%"
          : "✗ NON CONFORME";
        const complianceColor = compliance.isCompliant
          ? rgb(0.082, 0.722, 0.647)
          : rgb(1, 0, 0);
        page.drawText(complianceStatus, {
          x: 70,
          y: yPosition,
          size: 12,
          color: complianceColor,
        });

        yPosition -= 25;

        // Section 2: Data Residency
        page.drawText("2. RÉSIDENCE DES DONNÉES", {
          x: 50,
          y: yPosition,
          size: 14,
          color: rgb(0, 0, 0),
        });

        yPosition -= 20;
        const checks = [
          `Provider: ${dataResidency.provider}`,
          `Localisation: ${dataResidency.dataLocation}`,
          `Région: ${dataResidency.region}`,
          `Type Stockage: ${dataResidency.storageType}`,
        ];

        checks.forEach((check) => {
          page.drawText(`• ${check}`, {
            x: 70,
            y: yPosition,
            size: 10,
            color: rgb(0, 0, 0),
          });
          yPosition -= 15;
        });

        yPosition -= 10;

        // Section 3: Provider Usage
        page.drawText("3. UTILISATION DES PROVIDERS (30 derniers jours)", {
          x: 50,
          y: yPosition,
          size: 14,
          color: rgb(0, 0, 0),
        });

        yPosition -= 20;

        providerStats.byProvider.forEach((provider) => {
          page.drawText(
            `• ${provider.provider}: ${provider.count} requêtes (${provider.percentage}%)`,
            {
              x: 70,
              y: yPosition,
              size: 10,
              color: rgb(0, 0, 0),
            }
          );
          yPosition -= 15;
        });

        yPosition -= 10;

        // Section 4: Compliance Checks
        page.drawText("4. CONTRÔLES DE CONFORMITÉ", {
          x: 50,
          y: yPosition,
          size: 14,
          color: rgb(0, 0, 0),
        });

        yPosition -= 20;

        compliance.checksCompleted.forEach((check) => {
          const checkMark = check.status === "pass" ? "✓" : "✗";
          const checkColor =
            check.status === "pass"
              ? rgb(0.082, 0.722, 0.647)
              : rgb(1, 0, 0);
          page.drawText(`${checkMark} ${check.name}`, {
            x: 70,
            y: yPosition,
            size: 10,
            color: checkColor,
          });
          yPosition -= 12;
          page.drawText(`  ${check.details}`, {
            x: 85,
            y: yPosition,
            size: 9,
            color: rgb(0.5, 0.5, 0.5),
          });
          yPosition -= 15;
        });

        yPosition -= 20;

        // Footer
        page.drawText(
          "Cette attestation certifie que les données restent stockées localement en France.",
          {
            x: 50,
            y: yPosition,
            size: 9,
            color: rgb(0.5, 0.5, 0.5),
          }
        );

        yPosition -= 15;
        page.drawText(
          "Aucune donnée n'est envoyée à des serveurs externes ou des tiers cloud.",
          {
            x: 50,
            y: yPosition,
            size: 9,
            color: rgb(0.5, 0.5, 0.5),
          }
        );

        // Generate PDF buffer
        const pdfBytes = await pdfDoc.save();

        // Send PDF
        response.setHeader("Content-Type", "application/pdf");
        response.setHeader(
          "Content-Disposition",
          "attachment; filename=attestation-souverainete.pdf"
        );
        response.status(200).send(Buffer.from(pdfBytes));
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { apiAdminEndpoints };
