import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateWorkerWorkPreferencesDto } from "./dto/update-worker-work-preferences.dto";

@Injectable()
export class WorkerWorkPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId }, select: { id: true } });
    if (!worker) throw new NotFoundException("Worker profile not found");

    const [preference] = await this.prisma.$queryRaw<Array<{
      id: string;
      mobility: string;
      willingToRelocate: boolean;
      willingToTravel: boolean;
    }>>`
      SELECT "id", "mobility", "willingToRelocate", "willingToTravel"
      FROM "worker_work_preferences"
      WHERE "workerId" = ${worker.id}
      LIMIT 1
    `;

    const locations = await this.prisma.$queryRaw<Array<{
      id: string;
      city: string;
      district: string | null;
      state: string;
      country: string;
    }>>`
      SELECT "id", "city", "district", "state", "country"
      FROM "worker_preferred_locations"
      WHERE "workerId" = ${worker.id}
      ORDER BY "city" ASC
    `;

    return {
      mobility: preference?.mobility ?? "LOCAL",
      willingToRelocate: preference?.willingToRelocate ?? false,
      willingToTravel: preference?.willingToTravel ?? false,
      preferredLocations: locations,
    };
  }

  async update(userId: string, dto: UpdateWorkerWorkPreferencesDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId }, select: { id: true } });
    if (!worker) throw new NotFoundException("Worker profile not found");

    if (dto.mobility === "SPECIFIC_LOCATIONS" && !(dto.preferredLocations?.length)) {
      throw new BadRequestException("Add at least one preferred work location");
    }

    const locations = (dto.preferredLocations ?? [])
      .map((location) => ({
        city: location.city.trim(),
        district: location.district?.trim() || null,
        state: location.state.trim(),
        country: location.country?.trim() || "India",
      }))
      .filter((location) => location.city && location.state);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "worker_work_preferences"
        WHERE "workerId" = ${worker.id}
        LIMIT 1
      `;

      if (existing.length) {
        await tx.$executeRaw`
          UPDATE "worker_work_preferences"
          SET "mobility" = ${dto.mobility},
              "willingToRelocate" = ${dto.willingToRelocate ?? false},
              "willingToTravel" = ${dto.willingToTravel ?? false},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${existing[0].id}
        `;
      } else {
        await tx.$executeRaw`
          INSERT INTO "worker_work_preferences"
            ("id", "workerId", "mobility", "willingToRelocate", "willingToTravel", "createdAt", "updatedAt")
          VALUES
            (${randomUUID()}, ${worker.id}, ${dto.mobility}, ${dto.willingToRelocate ?? false}, ${dto.willingToTravel ?? false}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
      }

      await tx.$executeRaw`
        DELETE FROM "worker_preferred_locations"
        WHERE "workerId" = ${worker.id}
      `;

      for (const location of locations) {
        await tx.$executeRaw`
          INSERT INTO "worker_preferred_locations"
            ("id", "workerId", "city", "district", "state", "country", "createdAt")
          VALUES
            (${randomUUID()}, ${worker.id}, ${location.city}, ${location.district}, ${location.state}, ${location.country}, CURRENT_TIMESTAMP)
          ON CONFLICT ("workerId", "city", "state") DO NOTHING
        `;
      }

      const [preference] = await tx.$queryRaw<Array<{
        mobility: string;
        willingToRelocate: boolean;
        willingToTravel: boolean;
      }>>`
        SELECT "mobility", "willingToRelocate", "willingToTravel"
        FROM "worker_work_preferences"
        WHERE "workerId" = ${worker.id}
        LIMIT 1
      `;

      const savedLocations = await tx.$queryRaw<Array<{
        id: string;
        city: string;
        district: string | null;
        state: string;
        country: string;
      }>>`
        SELECT "id", "city", "district", "state", "country"
        FROM "worker_preferred_locations"
        WHERE "workerId" = ${worker.id}
        ORDER BY "city" ASC
      `;

      return {
        mobility: preference.mobility,
        willingToRelocate: preference.willingToRelocate,
        willingToTravel: preference.willingToTravel,
        preferredLocations: savedLocations,
      };
    });
  }
}
