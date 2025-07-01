import request from 'supertest';
import { startHttpServer } from '../../src/http-server.js';
import { PromptService } from '../../src/prompt-service.js';
import { MemoryAdapter } from '../../src/adapters.js';
import { WorkflowServiceImpl as WorkflowService } from '../../src/workflow-service.js';
import type { SequenceService } from '../../src/sequence-service.js';
import { closeServer } from '../setup.js';

let server: any;
let baseUrl: string;
let promptService: PromptService;
let adapter: MemoryAdapter;

class DummySequenceService {
  public async getSequenceWithPrompts(id: string) {
    return { id, prompts: [] };
  }
}

describe('/rpc JSON-RPC 2.0 Endpoint', () => {
  beforeAll(async () => {
    process.env.API_KEYS = 'test-key';
    adapter = new MemoryAdapter();
    await adapter.connect();
    promptService = new PromptService(adapter);
    const sequenceService = new DummySequenceService() as unknown as SequenceService;
    const workflowService = new WorkflowService(adapter, promptService);
    server = await startHttpServer(
      null,
      { host: '127.0.0.1', port: 0 },
      {
        promptService,
        sequenceService,
        storageAdapters: [adapter],
        workflowService,
        elevenLabsService: {} as any,
      },
    );
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await closeServer(server);
  });

  it('should return capabilities via getCapabilities', async () => {
    const res = await request(baseUrl)
      .post('/rpc')
      .send({ jsonrpc: '2.0', id: 1, method: 'getCapabilities', params: {} });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: expect.objectContaining({
        server: expect.any(String),
        version: expect.any(String),
        features: expect.any(Array),
        methods: expect.any(Array),
        protocol: expect.any(String),
      }),
    });
  });

  it('should return an empty prompt list for prompts.list', async () => {
    const res = await request(baseUrl)
      .post('/rpc')
      .send({ jsonrpc: '2.0', id: 2, method: 'prompts.list', params: {} });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      jsonrpc: '2.0',
      id: 2,
      result: [],
    });
  });

  it('should return method not found for unknown method', async () => {
    const res = await request(baseUrl)
      .post('/rpc')
      .send({ jsonrpc: '2.0', id: 3, method: 'unknown.method', params: {} });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      jsonrpc: '2.0',
      id: 3,
      error: expect.objectContaining({ code: -32601 }),
    });
  });

  it('should create, get, update, and delete a prompt via JSON-RPC', async () => {
    // Create
    const createRes = await request(baseUrl)
      .post('/rpc')
      .send({
        jsonrpc: '2.0',
        id: 10,
        method: 'prompts.create',
        params: {
          name: 'RPC Test',
          content: 'Hello, RPC!',
          isTemplate: false,
          tags: ['rpc'],
        },
      });
    expect(createRes.status).toBe(200);
    expect(createRes.body).toMatchObject({ jsonrpc: '2.0', id: 10 });
    const created = createRes.body.result;
    expect(created).toMatchObject({ name: 'RPC Test', content: 'Hello, RPC!' });
    expect(created.id).toBeDefined();
    expect(created.version).toBe(1);

    // Get
    const getRes = await request(baseUrl)
      .post('/rpc')
      .send({
        jsonrpc: '2.0',
        id: 11,
        method: 'prompts.get',
        params: { id: created.id },
      });
    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject({ jsonrpc: '2.0', id: 11 });
    expect(getRes.body.result).toMatchObject({ id: created.id, name: 'RPC Test' });

    // Update
    const updateRes = await request(baseUrl)
      .post('/rpc')
      .send({
        jsonrpc: '2.0',
        id: 12,
        method: 'prompts.update',
        params: { id: created.id, version: 1, content: 'Updated via RPC' },
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toMatchObject({ jsonrpc: '2.0', id: 12 });
    expect(updateRes.body.result.content).toBe('Updated via RPC');

    // Delete
    const deleteRes = await request(baseUrl)
      .post('/rpc')
      .send({
        jsonrpc: '2.0',
        id: 13,
        method: 'prompts.delete',
        params: { id: created.id },
      });
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toMatchObject({ jsonrpc: '2.0', id: 13 });
    expect(deleteRes.body.result.success).toBe(true);

    // Get after delete (should error)
    const getAfterDeleteRes = await request(baseUrl)
      .post('/rpc')
      .send({
        jsonrpc: '2.0',
        id: 14,
        method: 'prompts.get',
        params: { id: created.id },
      });
    expect(getAfterDeleteRes.status).toBe(200);
    expect(getAfterDeleteRes.body).toMatchObject({ jsonrpc: '2.0', id: 14 });
    expect(getAfterDeleteRes.body.error).toBeDefined();
  });

  it('should return an empty workflow list and log consent', async () => {
    // workflows.list
    const wfRes = await request(baseUrl)
      .post('/rpc')
      .send({ jsonrpc: '2.0', id: 20, method: 'workflows.list', params: {} });
    expect(wfRes.status).toBe(200);
    expect(wfRes.body).toMatchObject({ jsonrpc: '2.0', id: 20, result: [] });

    // consent
    const consentRes = await request(baseUrl)
      .post('/rpc')
      .send({
        jsonrpc: '2.0',
        id: 21,
        method: 'consent',
        params: { userId: 'test-user', action: 'test-action', details: { foo: 'bar' } },
      });
    expect(consentRes.status).toBe(200);
    expect(consentRes.body).toMatchObject({ jsonrpc: '2.0', id: 21 });
    expect(consentRes.body.result.success).toBe(true);
  });

  it('should error on workflows.execute for missing workflow', async () => {
    const res = await request(baseUrl)
      .post('/rpc')
      .send({
        jsonrpc: '2.0',
        id: 30,
        method: 'workflows.execute',
        params: { id: 'nonexistent' },
      });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ jsonrpc: '2.0', id: 30 });
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toMatch(/Workflow not found/);
  });

  it('should return empty array for tools.list', async () => {
    const res = await request(baseUrl)
      .post('/rpc')
      .send({ jsonrpc: '2.0', id: 31, method: 'tools.list', params: {} });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ jsonrpc: '2.0', id: 31, result: [] });
  });

  it('should return not implemented for tools.invoke', async () => {
    const res = await request(baseUrl)
      .post('/rpc')
      .send({ jsonrpc: '2.0', id: 32, method: 'tools.invoke', params: { tool: 'dummy' } });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ jsonrpc: '2.0', id: 32 });
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toMatch(/not implemented/i);
  });

  it('should filter prompts.list by tag and isTemplate', async () => {
    // Create two prompts
    await request(baseUrl).post('/rpc').send({
      jsonrpc: '2.0', id: 40, method: 'prompts.create', params: {
        name: 'A', content: 'A', isTemplate: false, tags: ['x', 'y']
      }
    });
    await request(baseUrl).post('/rpc').send({
      jsonrpc: '2.0', id: 41, method: 'prompts.create', params: {
        name: 'B', content: 'B', isTemplate: true, tags: ['y', 'z']
      }
    });
    // List prompts with tag 'y'
    const res1 = await request(baseUrl).post('/rpc').send({
      jsonrpc: '2.0', id: 42, method: 'prompts.list', params: { tags: ['y'] }
    });
    expect(res1.status).toBe(200);
    expect(res1.body.result.length).toBe(2);
    // List prompts with tag 'z' and isTemplate true
    const res2 = await request(baseUrl).post('/rpc').send({
      jsonrpc: '2.0', id: 43, method: 'prompts.list', params: { tags: ['z'], isTemplate: true }
    });
    expect(res2.status).toBe(200);
    expect(res2.body.result.length).toBe(1);
    expect(res2.body.result[0].name).toBe('B');
  });

  it('should error on consent with missing params', async () => {
    const res = await request(baseUrl)
      .post('/rpc')
      .send({ jsonrpc: '2.0', id: 50, method: 'consent', params: { action: 'missing-user' } });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ jsonrpc: '2.0', id: 50 });
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toMatch(/Missing userId/);
  });

  it('should return non-empty array for tools.list with tool metadata', async () => {
    const res = await request(baseUrl)
      .post('/rpc')
      .send({ jsonrpc: '2.0', id: 40, method: 'tools.list', params: {} });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ jsonrpc: '2.0', id: 40 });
    expect(Array.isArray(res.body.result)).toBe(true);
    expect(res.body.result.length).toBeGreaterThan(0);
    // Check at least one tool has required fields
    const tool = res.body.result.find(t => t.id && t.name && t.description);
    expect(tool).toBeDefined();
    expect(tool).toHaveProperty('id');
    expect(tool).toHaveProperty('name');
    expect(tool).toHaveProperty('description');
    expect(tool).toHaveProperty('variables');
  });

  it('should invoke a known template tool and return rendered content', async () => {
    // Use a known tool from the catalog, e.g., project-analysis-assistant or code-review-assistant
    const toolId = 'project-analysis-assistant';
    const args = {
      language: 'TypeScript',
      project_path: 'src/',
      specific_focus: 'API design',
      additional_context: 'Focus on REST endpoints.'
    };
    const res = await request(baseUrl)
      .post('/rpc')
      .send({
        jsonrpc: '2.0',
        id: 41,
        method: 'tools.invoke',
        params: { tool: toolId, args }
      });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ jsonrpc: '2.0', id: 41 });
    expect(res.body.result).toHaveProperty('content');
    expect(typeof res.body.result.content).toBe('string');
    expect(res.body.result.content).toMatch(/project structure/i);
  });

  it('should error on tools.invoke with missing tool id', async () => {
    const res = await request(baseUrl)
      .post('/rpc')
      .send({ jsonrpc: '2.0', id: 42, method: 'tools.invoke', params: {} });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ jsonrpc: '2.0', id: 42 });
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toMatch(/missing tool id/i);
  });

  it('should error on tools.invoke with non-existent tool id', async () => {
    const res = await request(baseUrl)
      .post('/rpc')
      .send({ jsonrpc: '2.0', id: 43, method: 'tools.invoke', params: { tool: 'nonexistent-tool', args: {} } });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ jsonrpc: '2.0', id: 43 });
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toMatch(/tool not found/i);
  });
}); 