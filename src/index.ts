#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Eliminate $ref references entirely (required by Moonshot/Kimi which rejects non-#/$defs/ refs)
const toJSON = (schema: z.ZodTypeAny) =>
  zodToJsonSchema(schema, { $refStrategy: 'none' });

import * as tasks from './operations/tasks.js';
import * as projects from './operations/projects.js';

import { formatTickTickError, isTickTickError } from './common/errors.js';
import { VERSION } from './common/version.js';
import z from 'zod';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import console from 'console';
import { main } from './cli.js';

// If fetch doesn't exist in global scope, add it
if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof global.fetch;
}

const server = new Server(
  {
    name: 'ticktick-mcp-server',
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_user_projects',
        description: 'Get all user projects',
        inputSchema: toJSON(z.object({})),
      },
      {
        name: 'get_project_by_id',
        description: 'Get a project by ID',
        inputSchema: toJSON(projects.ProjectIdOptionsSchema),
      },
      {
        name: 'get_project_with_data',
        description: 'Get a project with its tasks and columns',
        inputSchema: toJSON(projects.ProjectIdOptionsSchema),
      },
      {
        name: 'create_project',
        description: 'Create a new project',
        inputSchema: toJSON(projects.CreateProjectOptionsSchema),
      },
      {
        name: 'update_project',
        description: 'Update an existing project',
        inputSchema: toJSON(projects.UpdateProjectOptionsSchema),
      },
      {
        name: 'delete_project',
        description: 'Delete a project',
        inputSchema: toJSON(projects.ProjectIdOptionsSchema),
      },
      {
        name: 'get_task_by_ids',
        description: 'Get a task by ProjectId and TaskId',
        inputSchema: toJSON(tasks.GetTaskByIdsOptionsSchema),
      },
      {
        name: 'create_task',
        description: 'Create a new task',
        inputSchema: toJSON(tasks.CreateTaskOptionsSchema),
      },
      {
        name: 'update_task',
        description: 'Update an existing task',
        inputSchema: toJSON(tasks.UpdateTaskOptionsSchema),
      },
      {
        name: 'complete_task',
        description: 'Complete a task',
        inputSchema: toJSON(tasks.TasksIdsOptionsSchema),
      },
      {
        name: 'delete_task',
        description: 'Delete a task',
        inputSchema: toJSON(tasks.TasksIdsOptionsSchema),
      },
      {
        name: 'get_completed_tasks',
        description:
          'Get completed tasks across all projects within a date range',
        inputSchema: toJSON(tasks.GetCompletedTasksOptionsSchema),
      },
      {
        name: 'batch_update_tasks',
        description:
          'Batch create, update, and/or delete multiple tasks in a single request',
        inputSchema: toJSON(
          tasks.BatchUpdateTasksOptionsSchema.innerType()
        ),
      },
      {
        name: 'batch_create_tasks',
        description: 'Batch create multiple tasks in a single request',
        inputSchema: toJSON(tasks.BatchCreateTasksOptionsSchema),
      },
      {
        name: 'get_subtasks',
        description:
          'Get all subtasks of a parent task by fetching project data and filtering by parentId',
        inputSchema: toJSON(tasks.GetSubtasksOptionsSchema),
      },
      {
        name: 'get_current_user',
        description: 'Get the current authenticated user profile',
        inputSchema: toJSON(z.object({})),
      },
      {
        name: 'get_inbox_tasks',
        description:
          'Get tasks from the inbox (resolves inbox project ID automatically from user profile)',
        inputSchema: toJSON(tasks.GetInboxTasksOptionsSchema),
      },
      {
        name: 'get_all_tasks',
        description:
          'Get all tasks across all projects (optionally filter by status)',
        inputSchema: toJSON(tasks.GetAllTasksOptionsSchema),
      },
      {
        name: 'search_tasks',
        description: 'Search tasks by text in title, content, or description',
        inputSchema: toJSON(tasks.SearchTasksOptionsSchema),
      },
      {
        name: 'get_tasks_by_priority',
        description: 'Get tasks filtered by priority level',
        inputSchema: toJSON(tasks.GetTasksByPriorityOptionsSchema),
      },
      {
        name: 'get_tasks_due_today',
        description: 'Get tasks due today',
        inputSchema: toJSON(tasks.GetTasksDueTodayOptionsSchema),
      },
      {
        name: 'get_tasks_due_tomorrow',
        description: 'Get tasks due tomorrow',
        inputSchema: toJSON(tasks.GetTasksDueTomorrowOptionsSchema),
      },
      {
        name: 'get_tasks_due_this_week',
        description: 'Get tasks due this week (Monday-Sunday)',
        inputSchema: toJSON(tasks.GetTasksDueThisWeekOptionsSchema),
      },
      {
        name: 'get_tasks_due_in_days',
        description: 'Get tasks due within the next N days',
        inputSchema: toJSON(tasks.GetTasksDueInDaysOptionsSchema),
      },
      {
        name: 'get_overdue_tasks',
        description: 'Get overdue tasks (due date has passed)',
        inputSchema: toJSON(tasks.GetOverdueTasksOptionsSchema),
      },
      {
        name: 'get_engaged_tasks',
        description:
          'Get "engaged" tasks: high priority OR overdue (GTD-style hot tasks)',
        inputSchema: toJSON(tasks.GetEngagedTasksOptionsSchema),
      },
      {
        name: 'get_next_tasks',
        description:
          'Get "next" tasks: medium priority OR due tomorrow (GTD-style upcoming tasks)',
        inputSchema: toJSON(tasks.GetNextTasksOptionsSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const toolsWithoutArguments = ['get_user_projects', 'get_current_user'];

    if (
      !request.params.arguments &&
      !toolsWithoutArguments.includes(request.params.name)
    ) {
      throw new Error('Arguments are required');
    }

    switch (request.params.name) {
      case 'get_user_projects': {
        const result = await projects.getUserProjects();

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_project_by_id': {
        const args = projects.ProjectIdOptionsSchema.parse(
          request.params.arguments
        );

        const result = await projects.getProjectById(args.projectId);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_project_with_data': {
        const args = projects.ProjectIdOptionsSchema.parse(
          request.params.arguments
        );

        const result = await projects.getProjectWithData(args.projectId);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'create_project': {
        const args = projects.CreateProjectOptionsSchema.parse(
          request.params.arguments
        );

        const result = await projects.createProject(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'update_project': {
        const args = projects.UpdateProjectOptionsSchema.parse(
          request.params.arguments
        );

        const result = await projects.updateProject(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'delete_project': {
        const args = projects.ProjectIdOptionsSchema.parse(
          request.params.arguments
        );

        await projects.deleteProject(args.projectId);

        return {
          content: [{ type: 'text', text: 'Project deleted successfully' }],
        };
      }

      case 'get_task_by_ids': {
        const args = tasks.GetTaskByIdsOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.getTaskByIds(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'create_task': {
        const args = tasks.CreateTaskOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.createTask(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'update_task': {
        const args = tasks.UpdateTaskOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.updateTask(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'complete_task': {
        const args = tasks.TasksIdsOptionsSchema.parse(
          request.params.arguments
        );

        await tasks.completeTask(args);

        return {
          content: [{ type: 'text', text: 'Task completed successfully' }],
        };
      }

      case 'delete_task': {
        const args = tasks.TasksIdsOptionsSchema.parse(
          request.params.arguments
        );

        await tasks.deleteTask(args);

        return {
          content: [{ type: 'text', text: 'Task deleted successfully' }],
        };
      }

      case 'get_completed_tasks': {
        const args = tasks.GetCompletedTasksOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.getCompletedTasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'batch_update_tasks': {
        const args = tasks.BatchUpdateTasksOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.batchUpdateTasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'batch_create_tasks': {
        const args = tasks.BatchCreateTasksOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.batchCreateTasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_subtasks': {
        const args = tasks.GetSubtasksOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.getSubtasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_current_user': {
        const result = await tasks.getCurrentUser();

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_inbox_tasks': {
        const args = tasks.GetInboxTasksOptionsSchema.parse(
          request.params.arguments ?? {}
        );

        const result = await tasks.getInboxTasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_all_tasks': {
        const args = tasks.GetAllTasksOptionsSchema.parse(
          request.params.arguments ?? {}
        );

        const result = await tasks.getAllTasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'search_tasks': {
        const args = tasks.SearchTasksOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.searchTasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_tasks_by_priority': {
        const args = tasks.GetTasksByPriorityOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.getTasksByPriority(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_tasks_due_today': {
        const args = tasks.GetTasksDueTodayOptionsSchema.parse(
          request.params.arguments ?? {}
        );

        const result = await tasks.getTasksDueToday(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_tasks_due_tomorrow': {
        const args = tasks.GetTasksDueTomorrowOptionsSchema.parse(
          request.params.arguments ?? {}
        );

        const result = await tasks.getTasksDueTomorrow(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_tasks_due_this_week': {
        const args = tasks.GetTasksDueThisWeekOptionsSchema.parse(
          request.params.arguments ?? {}
        );

        const result = await tasks.getTasksDueThisWeek(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_tasks_due_in_days': {
        const args = tasks.GetTasksDueInDaysOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.getTasksDueInDays(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_overdue_tasks': {
        const args = tasks.GetOverdueTasksOptionsSchema.parse(
          request.params.arguments ?? {}
        );

        const result = await tasks.getOverdueTasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_engaged_tasks': {
        const args = tasks.GetEngagedTasksOptionsSchema.parse(
          request.params.arguments ?? {}
        );

        const result = await tasks.getEngagedTasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_next_tasks': {
        const args = tasks.GetNextTasksOptionsSchema.parse(
          request.params.arguments ?? {}
        );

        const result = await tasks.getNextTasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool name: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }
    if (isTickTickError(error)) {
      throw new Error(formatTickTickError(error));
    }
    throw error;
  }
});

async function runServer() {
  const initialized = await main();

  if (!initialized.ok) {
    console.error(initialized.message);
  }

  dotenv.config();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TickTick MCP Server running on stdio');
}

runServer().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
