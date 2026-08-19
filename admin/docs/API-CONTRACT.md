# WorkTrust Worker API Contract

The admin Worker module expects the NestJS API below.

## List workers

GET `/api/v1/workers`

Query parameters:

- page
- limit
- search
- skill
- location
- verificationStatus
- availability

Response:

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0,
  "totalPages": 0
}
```

## Worker details

GET `/api/v1/workers/:id`

Response shape:

```json
{
  "id": "uuid",
  "workerCode": "BCW-000124",
  "firstName": "Ravi",
  "lastName": "Kumar",
  "phone": "+919876543210",
  "email": "ravi@example.com",
  "profileImageUrl": null,
  "primarySkill": "Mason",
  "experienceYears": 7,
  "city": "Thanjavur",
  "state": "Tamil Nadu",
  "verificationScore": 95,
  "verificationStatus": "VERIFIED",
  "availability": "AVAILABLE",
  "languages": ["Tamil", "Hindi", "English"],
  "employmentHistory": [],
  "documents": [],
  "verifications": []
}
```

## Recommended NestJS route structure

```text
GET    /api/v1/workers
POST   /api/v1/workers
GET    /api/v1/workers/:id
PATCH  /api/v1/workers/:id
DELETE /api/v1/workers/:id

GET    /api/v1/workers/:id/employment
POST   /api/v1/workers/:id/employment
PATCH  /api/v1/workers/:id/employment/:employmentId
DELETE /api/v1/workers/:id/employment/:employmentId

GET    /api/v1/workers/:id/documents
POST   /api/v1/workers/:id/documents
PATCH  /api/v1/workers/:id/documents/:documentId

GET    /api/v1/workers/:id/verifications
POST   /api/v1/workers/:id/verifications
PATCH  /api/v1/workers/:id/verifications/:verificationId

POST   /api/v1/workers/:id/verifications/:verificationId/approve
POST   /api/v1/workers/:id/verifications/:verificationId/reject
```

Keep the frontend dependent on this API contract rather than directly accessing Prisma/PostgreSQL.
