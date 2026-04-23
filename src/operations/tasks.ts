import { z } from 'zod';
import { ticktickRequest } from '../common/utils.js';
import { TICKTICK_API_URL, TICKTICK_API_V2_URL } from '../common/urls.js';
import {
  TickTickCheckListItemSchema,
  TickTickCompletedTaskSchema,
  TickTickTaskDeleteSchema,
  TickTickTaskSchema,
  TickTickUserSchema,
} from '../common/types.js';
import { getProjectWithData, getUserProjects } from './projects.js';

export const GetTaskByIdsOptionsSchema = z.object({
  projectId: z.string().describe('Project identifier'),
  taskId: z.string().describe('Task identifier'),
});

export const GetTaskByIdsResponseSchema = TickTickTaskSchema;

export const CreateTaskOptionsSchema = z.object({
  title: z.string().describe('Task title'),
  projectId: z.string().describe('Project id'),
  content: z.string().optional().describe('Task content'),
  desc: z.string().optional().describe('Task description'),
  isAllDay: z.boolean().optional().describe('Is all day task'),
  startDate: z
    .string()
    .optional()
    .describe(`Task start date in "yyyy-MM-dd'T'HH:mm:ssZ" format`),
  dueDate: z
    .string()
    .optional()
    .describe(`Task due date in "yyyy-MM-dd'T'HH:mm:ssZ" format`),
  timeZone: z
    .string()
    .optional()
    .describe('Task time zone. Example: "America/Los_Angeles"'),
  reminders: z
    .array(z.string())
    .optional()
    .describe(
      'List of reminder triggers in iCalendar (RFC 5545) format. Example: ["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"]'
    ),
  repeatFlag: z
    .string()
    .optional()
    .describe(
      'Task repeat flag in iCalendar (RFC 5545) format. Example: RRULE:FREQ=DAILY;INTERVAL=1'
    ),
  priority: z
    .number()
    .optional()
    .describe('Task priority None: 0, Low: 1, Medium: 3, High: 5'),
  sortOrder: z.string().optional().describe('Task sort order. Example: 12345'),
  items: z
    .array(TickTickCheckListItemSchema)
    .optional()
    .describe('The list of subtasks'),
  parentId: z
    .string()
    .optional()
    .describe('Parent task ID to create this task as a subtask'),
});

export const UpdateTaskOptionsSchema = z.object({
  taskId: z.string().describe('Task identifier - Path'),
  id: z.string().describe('Task identifier - Body'),
  projectId: z.string().describe('Project id'),
  title: z.string().optional().describe('Task title'),
  content: z.string().optional().describe('Task content'),
  desc: z.string().optional().describe('Task description'),
  isAllDay: z.boolean().optional().describe('Is all day task'),
  startDate: z
    .string()
    .optional()
    .describe(`Task start date in "yyyy-MM-dd'T'HH:mm:ssZ" format`),
  dueDate: z
    .string()
    .optional()
    .describe(`Task due date in "yyyy-MM-dd'T'HH:mm:ssZ" format`),
  timeZone: z
    .string()
    .optional()
    .describe('Task time zone. Example: "America/Los_Angeles"'),
  reminders: z
    .array(z.string())
    .optional()
    .describe(
      'List of reminder triggers in iCalendar (RFC 5545) format. Example: ["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"]'
    ),
  repeatFlag: z
    .string()
    .optional()
    .describe(
      'Task repeat flag in iCalendar (RFC 5545) format. Example: RRULE:FREQ=DAILY;INTERVAL=1'
    ),
  priority: z
    .number()
    .optional()
    .describe('Task priority None: 0, Low: 1, Medium: 3, High: 5'),
  sortOrder: z.string().optional().describe('Task sort order. Example: 12345'),
  items: z
    .array(TickTickCheckListItemSchema)
    .optional()
    .describe('The list of subtasks'),
  parentId: z
    .string()
    .optional()
    .describe('Parent task ID to make this task a subtask'),
});

export const TasksIdsOptionsSchema = z.object({
  taskId: z.string().describe('Task identifier'),
  projectId: z.string().describe('Project identifier'),
});

type GetTaskByIdsParams = z.infer<typeof GetTaskByIdsOptionsSchema>;

type CreateTaskParams = z.infer<typeof CreateTaskOptionsSchema>;

type UpdateTaskParams = z.infer<typeof UpdateTaskOptionsSchema>;

type TasksIdsParams = z.infer<typeof TasksIdsOptionsSchema>;

export async function getTaskByIds(
  params: GetTaskByIdsParams
): Promise<z.infer<typeof GetTaskByIdsResponseSchema>> {
  const { projectId, taskId } = GetTaskByIdsOptionsSchema.parse(params);

  const url = `${TICKTICK_API_URL}/project/${projectId}/task/${taskId}`;

  const response = await ticktickRequest(url);

  return GetTaskByIdsResponseSchema.parse(response);
}

export async function createTask(
  params: CreateTaskParams
): Promise<z.infer<typeof TickTickTaskSchema>> {
  const url = `${TICKTICK_API_URL}/task`;

  const response = await ticktickRequest(url, {
    method: 'POST',
    body: {
      ...params,
    },
  });

  return TickTickTaskSchema.parse(response);
}

export async function updateTask(
  params: UpdateTaskParams
): Promise<z.infer<typeof TickTickTaskSchema>> {
  const { taskId, id, ...rest } = params;

  const url = `${TICKTICK_API_URL}/task/${taskId || id}`;

  const response = await ticktickRequest(url, {
    method: 'POST',
    body: {
      id: id || taskId,
      ...rest,
    },
  });

  return TickTickTaskSchema.parse(response);
}

export async function completeTask({
  taskId,
  projectId,
}: TasksIdsParams): Promise<void> {
  const url = `${TICKTICK_API_URL}/project/${projectId}/task/${taskId}/complete`;

  await ticktickRequest(url, {
    method: 'POST',
  });
}

export async function deleteTask({
  taskId,
  projectId,
}: TasksIdsParams): Promise<void> {
  const url = `${TICKTICK_API_URL}/project/${projectId}/task/${taskId}`;

  await ticktickRequest(url, {
    method: 'DELETE',
  });
}

// --- get_completed_tasks ---

export const GetCompletedTasksOptionsSchema = z.object({
  from: z
    .string()
    .describe(
      'Start datetime string, e.g. "2026-02-19T00:00:00.000+0000"'
    ),
  to: z
    .string()
    .optional()
    .describe(
      'End datetime string. Defaults to now if not provided'
    ),
  limit: z
    .number()
    .optional()
    .describe('Max number of results to return (default 100)'),
});

export const GetCompletedTasksResponseSchema = z.array(
  TickTickCompletedTaskSchema
);

type GetCompletedTasksParams = z.infer<typeof GetCompletedTasksOptionsSchema>;

export async function getCompletedTasks(
  params: GetCompletedTasksParams
): Promise<z.infer<typeof GetCompletedTasksResponseSchema>> {
  const { from, to, limit } = params;
  const toDate = to || new Date().toISOString();
  const resultLimit = limit || 100;

  const queryParams = new URLSearchParams({
    from,
    to: toDate,
    limit: String(resultLimit),
  });

  const url = `${TICKTICK_API_V2_URL}/project/all/completedInAll/?${queryParams.toString()}`;

  const response = await ticktickRequest(url);

  return GetCompletedTasksResponseSchema.parse(response);
}

// --- batch_update_tasks ---

export const BatchUpdateTasksOptionsSchema = z
  .object({
    add: z
      .array(TickTickTaskSchema.partial().extend({ title: z.string(), projectId: z.string() }))
      .optional()
      .describe('Array of task objects to create'),
    update: z
      .array(TickTickTaskSchema.partial().extend({ id: z.string(), projectId: z.string() }))
      .optional()
      .describe('Array of task objects to update'),
    delete: z
      .array(TickTickTaskDeleteSchema)
      .optional()
      .describe('Array of { taskId, projectId } objects to delete'),
  })
  .refine(
    (data) =>
      (data.add && data.add.length > 0) ||
      (data.update && data.update.length > 0) ||
      (data.delete && data.delete.length > 0),
    { message: 'At least one of add, update, or delete must be provided' }
  );

type BatchUpdateTasksParams = z.infer<typeof BatchUpdateTasksOptionsSchema>;

export async function batchUpdateTasks(
  params: BatchUpdateTasksParams
): Promise<unknown> {
  const url = `${TICKTICK_API_URL}/batch/task`;

  const body: Record<string, unknown> = {};
  if (params.add) body.add = params.add;
  if (params.update) body.update = params.update;
  if (params.delete) body.delete = params.delete;

  const response = await ticktickRequest(url, {
    method: 'POST',
    body,
  });

  return response;
}

// --- get_subtasks ---

export const GetSubtasksOptionsSchema = z.object({
  parentId: z.string().describe('Parent task ID to find subtasks for'),
  projectId: z.string().describe('Project ID containing the parent task'),
});

type GetSubtasksParams = z.infer<typeof GetSubtasksOptionsSchema>;

export async function getSubtasks(
  params: GetSubtasksParams
): Promise<z.infer<typeof TickTickTaskSchema>[]> {
  const { parentId, projectId } = params;

  const url = `${TICKTICK_API_URL}/project/${projectId}/data`;
  const response = await ticktickRequest(url);

  const projectData = z
    .object({
      tasks: z.array(TickTickTaskSchema),
    })
    .passthrough()
    .parse(response);

  return projectData.tasks.filter((task) => task.parentId === parentId);
}

// --- get_current_user ---

export async function getCurrentUser(): Promise<
  z.infer<typeof TickTickUserSchema>
> {
  const url = `${TICKTICK_API_URL}/user`;
  const response = await ticktickRequest(url);
  return TickTickUserSchema.parse(response);
}

// --- get_inbox_tasks ---

export const GetInboxTasksOptionsSchema = z.object({
  includeCompleted: z
    .boolean()
    .optional()
    .describe('Include completed tasks (default false)'),
});

type GetInboxTasksParams = z.infer<typeof GetInboxTasksOptionsSchema>;

export async function getInboxTasks(params: GetInboxTasksParams) {
  const user = await getCurrentUser();
  const inboxProjectId = `inbox${user.id}`;
  const data = await getProjectWithData(inboxProjectId);

  if (!params.includeCompleted) {
    data.tasks = data.tasks.filter((task) => task.status !== 2);
  }

  return data;
}

// ============================================================
// NEW HELPER FUNCTIONS (date queries, search, GTD, etc.)
// ============================================================

// --- Date helpers ---

function parseTaskDate(date: string | number | undefined): Date | null {
  if (!date) return null;
  if (typeof date === 'number') {
    return new Date(date > 1e12 ? date : date * 1000);
  }
  return new Date(date);
}

function getStartOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function getEndOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

function getStartOfWeekUTC(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  return getStartOfDayUTC(monday);
}

function getEndOfWeekUTC(d: Date): Date {
  const start = getStartOfWeekUTC(d);
  const sunday = new Date(start);
  sunday.setUTCDate(start.getUTCDate() + 6);
  return getEndOfDayUTC(sunday);
}

// --- Core: fetch all tasks across all projects ---

export const GetAllTasksOptionsSchema = z.object({
  status: z
    .enum(['all', 'uncompleted', 'completed'])
    .optional()
    .describe('Filter by task status (default: uncompleted)'),
});

type GetAllTasksParams = z.infer<typeof GetAllTasksOptionsSchema>;

export async function getAllTasks(params: GetAllTasksParams = {}) {
  const parsed = GetAllTasksOptionsSchema.parse(params);
  const status = parsed.status || 'uncompleted';
  const projects = await getUserProjects();
  const allTasks: z.infer<typeof TickTickTaskSchema>[] = [];

  for (const project of projects) {
    try {
      const data = await getProjectWithData(project.id);
      allTasks.push(...data.tasks);
    } catch {
      // Skip projects we can't access
    }
  }

  if (status === 'uncompleted') {
    return allTasks.filter((t) => t.status !== 2);
  }
  if (status === 'completed') {
    return allTasks.filter((t) => t.status === 2);
  }
  return allTasks;
}

// --- Search tasks ---

export const SearchTasksOptionsSchema = z.object({
  query: z.string().describe('Search text to match against task title and content'),
  status: z
    .enum(['all', 'uncompleted', 'completed'])
    .optional()
    .describe('Filter by task status (default: uncompleted)'),
});

type SearchTasksParams = z.infer<typeof SearchTasksOptionsSchema>;

export async function searchTasks(params: SearchTasksParams) {
  const parsed = SearchTasksOptionsSchema.parse(params);
  const { query, status = 'uncompleted' } = parsed;
  const tasks = await getAllTasks({ status });
  const lowerQuery = query.toLowerCase();
  return tasks.filter(
    (t) =>
      t.title?.toLowerCase().includes(lowerQuery) ||
      t.content?.toLowerCase().includes(lowerQuery) ||
      t.desc?.toLowerCase().includes(lowerQuery)
  );
}

// --- Get tasks by priority ---

export const GetTasksByPriorityOptionsSchema = z.object({
  priority: z
    .number()
    .describe('Task priority: 0=None, 1=Low, 3=Medium, 5=High'),
  status: z
    .enum(['all', 'uncompleted', 'completed'])
    .optional()
    .describe('Filter by task status (default: uncompleted)'),
});

type GetTasksByPriorityParams = z.infer<typeof GetTasksByPriorityOptionsSchema>;

export async function getTasksByPriority(params: GetTasksByPriorityParams) {
  const parsed = GetTasksByPriorityOptionsSchema.parse(params);
  const { priority, status = 'uncompleted' } = parsed;
  const tasks = await getAllTasks({ status });
  return tasks.filter((t) => t.priority === priority);
}

// --- Date-based queries ---

export const GetTasksDueTodayOptionsSchema = z.object({
  status: z
    .enum(['all', 'uncompleted', 'completed'])
    .optional()
    .describe('Filter by task status (default: uncompleted)'),
});

export const GetTasksDueTomorrowOptionsSchema = z.object({
  status: z
    .enum(['all', 'uncompleted', 'completed'])
    .optional()
    .describe('Filter by task status (default: uncompleted)'),
});

export const GetTasksDueThisWeekOptionsSchema = z.object({
  status: z
    .enum(['all', 'uncompleted', 'completed'])
    .optional()
    .describe('Filter by task status (default: uncompleted)'),
});

export const GetTasksDueInDaysOptionsSchema = z.object({
  days: z
    .number()
    .min(1)
    .max(365)
    .describe('Number of days from today (1-365)'),
  status: z
    .enum(['all', 'uncompleted', 'completed'])
    .optional()
    .describe('Filter by task status (default: uncompleted)'),
});

export const GetOverdueTasksOptionsSchema = z.object({
  status: z
    .enum(['all', 'uncompleted', 'completed'])
    .optional()
    .describe('Filter by task status (default: uncompleted)'),
});

type GetTasksDueTodayParams = z.infer<typeof GetTasksDueTodayOptionsSchema>;
type GetTasksDueTomorrowParams = z.infer<typeof GetTasksDueTomorrowOptionsSchema>;
type GetTasksDueThisWeekParams = z.infer<typeof GetTasksDueThisWeekOptionsSchema>;
type GetTasksDueInDaysParams = z.infer<typeof GetTasksDueInDaysOptionsSchema>;
type GetOverdueTasksParams = z.infer<typeof GetOverdueTasksOptionsSchema>;

export async function getTasksDueToday(params: GetTasksDueTodayParams = {}) {
  const parsed = GetTasksDueTodayOptionsSchema.parse(params);
  const status = parsed.status || 'uncompleted';
  const tasks = await getAllTasks({ status });
  const now = new Date();
  const start = getStartOfDayUTC(now);
  const end = getEndOfDayUTC(now);
  return tasks.filter((t) => {
    const due = parseTaskDate(t.dueDate);
    return due !== null && due >= start && due <= end;
  });
}

export async function getTasksDueTomorrow(params: GetTasksDueTomorrowParams = {}) {
  const parsed = GetTasksDueTomorrowOptionsSchema.parse(params);
  const status = parsed.status || 'uncompleted';
  const tasks = await getAllTasks({ status });
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(now.getUTCDate() + 1);
  const start = getStartOfDayUTC(tomorrow);
  const end = getEndOfDayUTC(tomorrow);
  return tasks.filter((t) => {
    const due = parseTaskDate(t.dueDate);
    return due !== null && due >= start && due <= end;
  });
}

export async function getTasksDueThisWeek(params: GetTasksDueThisWeekParams = {}) {
  const parsed = GetTasksDueThisWeekOptionsSchema.parse(params);
  const status = parsed.status || 'uncompleted';
  const tasks = await getAllTasks({ status });
  const now = new Date();
  const start = getStartOfWeekUTC(now);
  const end = getEndOfWeekUTC(now);
  return tasks.filter((t) => {
    const due = parseTaskDate(t.dueDate);
    return due !== null && due >= start && due <= end;
  });
}

export async function getTasksDueInDays(params: GetTasksDueInDaysParams) {
  const parsed = GetTasksDueInDaysOptionsSchema.parse(params);
  const { days, status = 'uncompleted' } = parsed;
  const tasks = await getAllTasks({ status });
  const now = new Date();
  const start = getStartOfDayUTC(now);
  const future = new Date(now);
  future.setUTCDate(now.getUTCDate() + days);
  const end = getEndOfDayUTC(future);
  return tasks.filter((t) => {
    const due = parseTaskDate(t.dueDate);
    return due !== null && due >= start && due <= end;
  });
}

export async function getOverdueTasks(params: GetOverdueTasksParams = {}) {
  const parsed = GetOverdueTasksOptionsSchema.parse(params);
  const status = parsed.status || 'uncompleted';
  const tasks = await getAllTasks({ status });
  const now = new Date();
  const startOfToday = getStartOfDayUTC(now);
  return tasks.filter((t) => {
    const due = parseTaskDate(t.dueDate);
    return due !== null && due < startOfToday;
  });
}

// --- GTD helpers ---

export const GetEngagedTasksOptionsSchema = z.object({
  status: z
    .enum(['all', 'uncompleted', 'completed'])
    .optional()
    .describe('Filter by task status (default: uncompleted)'),
});

export const GetNextTasksOptionsSchema = z.object({
  status: z
    .enum(['all', 'uncompleted', 'completed'])
    .optional()
    .describe('Filter by task status (default: uncompleted)'),
});

type GetEngagedTasksParams = z.infer<typeof GetEngagedTasksOptionsSchema>;
type GetNextTasksParams = z.infer<typeof GetNextTasksOptionsSchema>;

export async function getEngagedTasks(params: GetEngagedTasksParams = {}) {
  const parsed = GetEngagedTasksOptionsSchema.parse(params);
  const status = parsed.status || 'uncompleted';
  const tasks = await getAllTasks({ status });
  const now = new Date();
  const startOfToday = getStartOfDayUTC(now);
  return tasks.filter((t) => {
    const isHighPriority = t.priority === 5;
    const due = parseTaskDate(t.dueDate);
    const isOverdue = due !== null && due < startOfToday;
    return isHighPriority || isOverdue;
  });
}

export async function getNextTasks(params: GetNextTasksParams = {}) {
  const parsed = GetNextTasksOptionsSchema.parse(params);
  const status = parsed.status || 'uncompleted';
  const tasks = await getAllTasks({ status });
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(now.getUTCDate() + 1);
  const startOfTomorrow = getStartOfDayUTC(tomorrow);
  const endOfTomorrow = getEndOfDayUTC(tomorrow);
  return tasks.filter((t) => {
    const isMediumPriority = t.priority === 3;
    const due = parseTaskDate(t.dueDate);
    const isDueTomorrow = due !== null && due >= startOfTomorrow && due <= endOfTomorrow;
    return isMediumPriority || isDueTomorrow;
  });
}

// --- Batch create tasks (convenience wrapper) ---

export const BatchCreateTasksOptionsSchema = z.object({
  tasks: z
    .array(
      TickTickTaskSchema.partial().extend({
        title: z.string().describe('Task title'),
        projectId: z.string().describe('Project id'),
      })
    )
    .describe('Array of task objects to create'),
});

type BatchCreateTasksParams = z.infer<typeof BatchCreateTasksOptionsSchema>;

export async function batchCreateTasks(params: BatchCreateTasksParams) {
  const { tasks: taskList } = BatchCreateTasksOptionsSchema.parse(params);
  return batchUpdateTasks({ add: taskList });
}
