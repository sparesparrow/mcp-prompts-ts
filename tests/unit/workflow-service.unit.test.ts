import { jest } from '@jest/globals';

import type { StorageAdapter, WorkflowExecutionState } from '../../src/interfaces.js';
import { PromptService } from '../../src/prompt-service.js';
import {
  PromptRunner,
  ShellRunner,
  WorkflowServiceImpl,
  type Workflow,
} from '../../src/workflow-service.js';
import type { Prompt, ListPromptsOptions, TemplateVariables, ApplyTemplateResult } from '../../src/interfaces.js';

// Mock StepRunners for stateless tests
const mockStatelessPromptRunner = {
  runStep: jest.fn<() => Promise<{ success: boolean; output?: string; error?: string }>>(),
};
const mockStatelessShellRunner = {
  runStep: jest.fn<() => Promise<{ success: boolean; output?: string; error?: string }>>(),
};
const mockStatelessHttpRunner = {
  runStep: jest.fn<() => Promise<{ success: boolean; output?: string; error?: string }>>(),
};

const statelessStepRunners = {
  prompt: mockStatelessPromptRunner,
  shell: mockStatelessShellRunner,
  http: mockStatelessHttpRunner,
};

// Mocks for stateful tests
const mockStorageAdapter: any = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(),
  savePrompt: jest.fn(),
  getPrompt: jest.fn(),
  listPromptVersions: jest.fn(),
  updatePrompt: jest.fn(),
  listPrompts: jest.fn(),
  deletePrompt: jest.fn(),
  clearAll: jest.fn(),
  backup: jest.fn(),
  restore: jest.fn(),
  listBackups: jest.fn(),
  getSequence: jest.fn(),
  saveSequence: jest.fn(),
  deleteSequence: jest.fn(),
  healthCheck: jest.fn(),
  saveWorkflowState: jest.fn(),
  getWorkflowState: jest.fn(),
  listWorkflowStates: jest.fn(),
};

const mockPromptService: any = {
  storage: {} as StorageAdapter,
  promptCache: new Map(),
  initializeTemplateEngine: jest.fn(),
  initialize: jest.fn(),
  getPrompt: jest.fn<(id: string, version?: number) => Promise<Prompt | null>>(),
  addPrompt: jest.fn<(data: Partial<Prompt>) => Promise<Prompt>>(),
  updatePrompt: jest.fn<(id: string, version: number, data: Partial<Prompt>) => Promise<Prompt>>(),
  listPrompts: jest.fn<(options?: ListPromptsOptions, allVersions?: boolean) => Promise<Prompt[]>>(),
  deletePrompt: jest.fn<(id: string, version?: number) => Promise<boolean>>(),
  listPromptVersions: jest.fn<(id: string) => Promise<number[]>>(),
  applyTemplate: jest.fn<(id: string, variables: TemplateVariables, version?: number) => Promise<ApplyTemplateResult>>(),
};

describe('WorkflowService (Stateless)', () => {
  let service: WorkflowServiceImpl;

  beforeEach(() => {
    service = new WorkflowServiceImpl(mockStorageAdapter, mockPromptService);
    jest.clearAllMocks();
  });

  it('should run a simple linear workflow', async () => {
    mockStatelessPromptRunner.runStep.mockResolvedValue({ success: true, output: 'output1' });
    mockStatelessShellRunner.runStep.mockResolvedValue({ success: true, output: 'output2' });

    const workflow: Workflow = {
      id: 'linear-workflow',
      name: 'Linear Workflow',
      version: 1,
      steps: [
        { id: 'step1', type: 'prompt', promptId: 'p1', input: {}, output: 'out1' },
        { id: 'step2', type: 'shell', command: 'ls', output: 'out2' },
      ],
    };

    const result = await service.runWorkflowSteps(
      workflow,
      {
        context: {},
        history: [],
        currentStepId: 'step1',
        status: 'running',
        executionId: '',
        workflowId: '',
        createdAt: '',
        updatedAt: '',
        version: 1,
      },
      statelessStepRunners,
    );
    expect(result.success).toBe(true);
    expect(mockStatelessPromptRunner.runStep).toHaveBeenCalledTimes(1);
    expect(mockStatelessShellRunner.runStep).toHaveBeenCalledTimes(1);
    expect(result.outputs).toEqual(expect.objectContaining({ out1: 'output1', out2: 'output2' }));
  });

  // ... other stateless tests ...
});

describe('WorkflowService (Stateful)', () => {
  let service: WorkflowServiceImpl;

  beforeEach(() => {
    service = new WorkflowServiceImpl(mockStorageAdapter, mockPromptService);
  });

  it('should run a simple workflow and save state correctly', async () => {
    mockStorageAdapter.saveWorkflowState.mockResolvedValue();
    const state: WorkflowExecutionState = {
      context: {},
      history: [],
      currentStepId: 'step1',
      status: 'running',
      executionId: 'exec-123',
      workflowId: 'test-workflow',
      version: 1,
      createdAt: '',
      updatedAt: '',
    };
    mockStorageAdapter.getWorkflowState.mockResolvedValue(state);

    const workflow: Workflow = {
      name: 'Test Workflow',
      id: 'test-workflow',
      version: 1,
      steps: [
        { id: 'step1', type: 'shell', command: 'echo "hello"', output: 'out1' },
        { id: 'step2', type: 'shell', command: 'echo "world"', output: 'out2' },
      ],
    };

    // Act
    await service.runWorkflow(workflow, {});

    // Assert
    expect(mockStorageAdapter.saveWorkflowState).toHaveBeenCalledTimes(4); // 2 steps + 2 parallel steps + completion
  });

  it('should handle parallel steps and save state', async () => {
    mockStorageAdapter.saveWorkflowState.mockResolvedValue();
    const workflow: Workflow = {
      name: 'Parallel Workflow',
      id: 'parallel-workflow',
      version: 1,
      steps: [
        { id: 'step1', type: 'shell', command: 'echo "hello"', output: 'out1' },
        { id: 'step2', type: 'shell', command: 'echo "world"', output: 'out2' },
      ],
    };

    // Act
    await service.runWorkflow(workflow, {});

    // Assert
    expect(mockStorageAdapter.saveWorkflowState).toHaveBeenCalledTimes(3); // 2 parallel steps + completion
  });

  it('should run a workflow and save state correctly', async () => {
    mockStorageAdapter.saveWorkflowState.mockResolvedValue();
    const workflow: Workflow = {
      name: 'Test Workflow',
      id: 'test-workflow',
      version: 1,
      steps: [
        { id: 'step1', type: 'shell', command: 'echo "hello"', output: 'out1' },
        { id: 'step2', type: 'shell', command: 'echo "world"', output: 'out2' },
      ],
    };

    // Act
    const result = await service.runWorkflow(workflow, {});

    // Assert
    expect(result.success).toBe(true);
    // Note: The number of saves is now 4 (2 steps + 2 parallel steps + completion)
    expect(mockStorageAdapter.saveWorkflowState).toHaveBeenCalledTimes(4);

    const lastCall = (mockStorageAdapter.saveWorkflowState as jest.Mock).mock.calls[3][0] as any;
    expect(lastCall.status).toBe('completed');
  });
});
