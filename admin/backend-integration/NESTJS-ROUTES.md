# NestJS integration checklist

Implement the following module in the existing backend:

```text
src/workers/
├── workers.module.ts
├── workers.controller.ts
├── workers.service.ts
├── dto/
│   ├── create-worker.dto.ts
│   ├── update-worker.dto.ts
│   └── worker-query.dto.ts
└── mappers/
    └── worker.mapper.ts
```

The controller should expose:

```text
GET    /api/v1/workers
GET    /api/v1/workers/:id
POST   /api/v1/workers
PATCH  /api/v1/workers/:id
DELETE /api/v1/workers/:id
```

And nested resources:

```text
GET/POST/PATCH/DELETE
/api/v1/workers/:workerId/employment/...

GET/POST/PATCH
/api/v1/workers/:workerId/documents/...

GET/POST/PATCH
/api/v1/workers/:workerId/verifications/...
```

Important:
1. Prisma remains inside NestJS only.
2. Next.js never connects directly to PostgreSQL.
3. Worker sensitive documents should be protected by authorization.
4. Every verification mutation should create an audit log.
5. Do not return raw identity/background-check data to employer-facing APIs.
