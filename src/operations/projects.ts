import { undefined, z } from 'zod';
import { getFormattedColor, ticktickRequest } from '../common/utils.js';
import { TICKTICK_API_URL } from '../common/urls.js';
import { TickTickProjectSchema, TickTickTaskSchema } from '../common/types.js';

export const GetUserProjectsResponseSchema = z.array(TickTickProjectSchema);

export const GetProjectWithDataResponseSchema = z.object({
  project: TickTickProjectSchema.optional(),
  tasks: z.array(TickTickTaskSchema),
  columns: z
    .array(
      z
        .object({
          id: z.string().optional(),
          projectId: z.string().optional(),
          name: z.string().optional(),
          sortOrder: z.number().optional(),
        })
        .optional()
    )
    .optional(),
});

export const ProjectIdOptionsSchema = z.object({
  projectId: z.string().describe('Project identifier'),
});

export const CreateProjectOptionsSchema = z.object({
  name: z.string().describe('Project name'),
  color: z.string().default('#4772FA').optional().describe('Project color'),
  viewMode: z
    .enum(['list', 'kanban', 'timeline'])
    .default('list')
    .optional()
    .describe('View mode'),
  kind: z
    .enum(['TASK', 'NOTE'])
    .default('TASK')
    .optional()
    .describe('Project kind'),
});

export const UpdateProjectOptionsSchema = z.object({
  projectId: z.string().describe('Project identifier'),
  name: z.string().optional().describe('Project name'),
  color: z.string().optional().describe('Project color'),
  sortOrder: z.number().optional().describe('Project sort order'),
  viewMode: z
    .enum(['list', 'kanban', 'timeline'])
    .optional()
    .describe('View mode'),
  kind: z.enum(['TASK', 'NOTE']).optional().describe('Project kind'),
  closed: z.boolean().optional().describe('Close or reopen the project'),
});

type CreateProjectParams = z.infer<typeof CreateProjectOptionsSchema>;

type UpdateProjectParams = z.infer<typeof UpdateProjectOptionsSchema>;

export async function getUserProjects(): Promise<
  z.infer<typeof GetUserProjectsResponseSchema>
> {
  const response = await ticktickRequest(`${TICKTICK_API_URL}/project`);

  return GetUserProjectsResponseSchema.parse(response);
}

export async function getProjectById(
  projectId: string
): Promise<z.infer<typeof TickTickProjectSchema>> {
  const response = await ticktickRequest(
    `${TICKTICK_API_URL}/project/${projectId}`
  );

  return TickTickProjectSchema.parse(response);
}

export async function getProjectWithData(
  projectId: string
): Promise<z.infer<typeof GetProjectWithDataResponseSchema>> {
  const response = await ticktickRequest(
    `${TICKTICK_API_URL}/project/${projectId}/data`
  );

  return GetProjectWithDataResponseSchema.parse(response);
}

export async function createProject(
  params: CreateProjectParams
): Promise<z.infer<typeof TickTickProjectSchema>> {
  const { color, ...rest } = params;

  const response = await ticktickRequest(`${TICKTICK_API_URL}/project`, {
    method: 'POST',
    body: {
      color: getFormattedColor(color),
      ...rest,
    },
  });

  return TickTickProjectSchema.parse(response);
}

export async function updateProject(
  params: UpdateProjectParams
): Promise<z.infer<typeof TickTickProjectSchema>> {
  const { color, projectId, ...rest } = params;

  const response = await ticktickRequest(
    `${TICKTICK_API_URL}/project/${projectId}`,
    {
      method: 'POST',
      body: {
        color: color ? getFormattedColor(color) : undefined,
        ...rest,
      },
    }
  );

  return TickTickProjectSchema.parse(response);
}

export async function deleteProject(projectId: string): Promise<void> {
  await ticktickRequest(`${TICKTICK_API_URL}/project/${projectId}`, {
    method: 'DELETE',
  });
}
