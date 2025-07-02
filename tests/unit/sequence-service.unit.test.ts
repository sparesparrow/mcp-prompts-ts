import { MemoryAdapter } from '../../src/adapters.js';
import { SequenceApplication, ISequenceRepository } from '../../src/sequence-service.js';

describe('SequenceService', () => {
  let storage: ISequenceRepository;
  let service: SequenceApplication;

  beforeEach(async () => {
    storage = new MemoryAdapter();
    await (storage as any).connect();
    service = new SequenceApplication(storage);
  });

  it('should create and retrieve a sequence (happy path)', async () => {
    const seq = await service.createSequence({
      description: 'Demo',
      name: 'Test Sequence',
      promptIds: ['p1', 'p2'],
    });
    expect(seq.id).toBeDefined();
    const result = await service.getSequenceWithPrompts(seq.id);
    expect(result.sequence.name).toBe('Test Sequence');
    expect(result.sequence.promptIds).toEqual(['p1', 'p2']);
    expect(Array.isArray(result.prompts)).toBe(true);
  });

  it('should return not found for unknown sequence', async () => {
    await expect(service.getSequenceWithPrompts('nonexistent')).rejects.toThrow(/not found/i);
  });

  it('should throw for invalid ID', async () => {
    await expect(service.getSequenceWithPrompts('')).rejects.toThrow();
  });
});
