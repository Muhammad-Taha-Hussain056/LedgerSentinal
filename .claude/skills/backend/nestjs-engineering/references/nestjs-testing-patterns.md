---
name: nestjs-testing-patterns
description: Rules for unit tests, integration tests, and E2E tests in NestJS. @nestjs/testing setup, mocking repositories, testing services and controllers, and what each test type covers. Load for any new test file or when changing an existing test.
---

# Testing patterns

Three test types, each with a distinct scope. Never blend concerns. Every test uses `@nestjs/testing` — never mock the entire NestJS container.

## Test taxonomy

| Type | Scope | What to mock | File pattern |
|---|---|---|---|
| Unit | One class in isolation | All dependencies | `*.service.spec.ts`, `*.handler.spec.ts` |
| Integration | Full module with real DI, in-memory or test DB | External services only | `*.module.spec.ts` |
| E2E | Full HTTP stack + real DB | Nothing (optionally stub external APIs) | `*.e2e-spec.ts` |

## Unit test — service in isolation

```ts
// users/users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    const mockRepo: jest.Mocked<IUserRepository> = {
      findById:       jest.fn(),
      findOne:        jest.fn(),
      findMany:       jest.fn(),
      findPaginated:  jest.fn(),
      create:         jest.fn(),
      update:         jest.fn(),
      delete:         jest.fn(),
      exists:         jest.fn(),
      count:          jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY,   useValue: mockRepo },
        { provide: EventEmitter2,     useValue: { emit: jest.fn() } },
        { provide: AppConfigService,  useValue: { isProduction: false } },
      ],
    }).compile();

    service = module.get(UsersService);
    repo    = module.get(USER_REPOSITORY);
  });

  describe('findOne', () => {
    it('returns the user when found', async () => {
      const user = buildUser({ id: 'usr-1' });
      repo.findById.mockResolvedValue(user);

      const result = await service.findOne('usr-1', buildActor({ tenantId: user.tenantId }));

      expect(result).toEqual(user);
      expect(repo.findById).toHaveBeenCalledWith('usr-1');
    });

    it('throws NotFoundException when user does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne('usr-missing', buildActor())).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when tenantId mismatches', async () => {
      repo.findById.mockResolvedValue(buildUser({ tenantId: 'tenant-A' }));
      await expect(service.findOne('usr-1', buildActor({ tenantId: 'tenant-B' }))).rejects.toThrow(ForbiddenException);
    });
  });
});
```

## Test factories — `buildXxx` helpers, never inline objects

```ts
// test/factories/user.factory.ts
export const buildUser = (overrides?: Partial<User>): User => ({
  id:         randomUUID(),
  email:      'test@example.com',
  name:       'Test User',
  role:       UserRole.MEMBER,
  tenantId:   'tenant-default',
  status:     UserStatus.ACTIVE,
  createdAt:  new Date('2026-01-01T00:00:00Z'),
  updatedAt:  new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

export const buildActor = (overrides?: Partial<ActorContext>): ActorContext => ({
  userId:      randomUUID(),
  tenantId:    'tenant-default',
  email:       'actor@example.com',
  role:        UserRole.ADMIN,
  permissions: ['users:read', 'users:write'],
  ...overrides,
});
```

## Integration test — full module, real DI

```ts
// users/users.module.spec.ts
describe('UsersModule (integration)', () => {
  let module: TestingModule;
  let service: UsersService;
  let db: DrizzleInstance;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: '.env.test' }),
        DatabaseModule,     // real Postgres test DB
        UsersModule,
      ],
    }).compile();

    service = module.get(UsersService);
    db      = module.get(DRIZZLE_TOKEN);
    await runMigrations(db);
  });

  afterAll(async () => {
    await db.execute(sql`TRUNCATE users CASCADE`);
    await module.close();
  });

  it('creates and retrieves a user', async () => {
    const actor = buildActor();
    const user  = await service.create({ email: 'integration@test.com', name: 'Integration User', role: UserRole.MEMBER }, actor);
    const found = await service.findOne(user.id, actor);
    expect(found.email).toBe('integration@test.com');
  });
});
```

## E2E test — full HTTP stack

```ts
// test/users.e2e-spec.ts
describe('/users (E2E)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    // Get a test JWT
    token = await getTestToken(app, { role: UserRole.ADMIN, permissions: ['users:read', 'users:write'] });
  });

  afterAll(() => app.close());

  it('GET /users — returns paginated list', () =>
    request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('total');
      }),
  );

  it('POST /users — 400 on missing required field', () =>
    request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Only Name' })   // missing email and role
      .expect(400),
  );
});
```

## Test coverage rules

| Layer | Required coverage |
|---|---|
| Service methods | All public methods: success path + every exception path |
| Repository | Integration test with real DB; not unit mocked |
| Controller | E2E or integration — not unit (controller is just wiring) |
| Guards | Unit test `canActivate` returning `true` and `false` |
| Event handlers | Unit test — mock the service/external adapter |

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Asserting on mock call counts as primary assertion | Assert on observable output first; call count is secondary |
| Inline `{ id: '1', email: '...' }` in every test | Use `buildUser()` factory with overrides |
| `jest.mock('../../users.service')` | Use `Test.createTestingModule` with `useValue` mock |
| Testing the controller in a unit test | Controller is pure wiring — test via E2E or integration |
| Skipping the failure/exception path | Every error case thrown by the service must have a test |
| Real external API calls in unit tests | Mock at the adapter level (`{ provide: PAYMENT_GATEWAY, useValue: ... }`) |
| `describe.skip` or `it.skip` committed | Fix or remove; never commit skipped tests |
