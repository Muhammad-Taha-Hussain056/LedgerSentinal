import 'reflect-metadata';

import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';

describe('API module harness', () => {
  it('initializes and resolves the real application module without external services', async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    try {
      await module.init();
      expect(module.get(AppModule)).toBeInstanceOf(AppModule);
    } finally {
      await module.close();
    }
  });
});
