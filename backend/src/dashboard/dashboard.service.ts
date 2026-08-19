import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getDashboard() {
    const [
      totalWorkers,
      verifiedWorkers,
      totalEmployers,
      activeJobs,
      completedJobs,

      recentWorkers,
      recentVerifications,

      verificationOverview,

      registrations,
    ] = await Promise.all([
      // Total workers
      this.prisma.worker.count(),

      // Verified workers
      this.prisma.worker.count({
        where: {
          verificationStatus: "VERIFIED",
        },
      }),

      // Total employers
      this.prisma.employer.count(),

      // Published / active jobs
      this.prisma.job.count({
        where: {
          status: "PUBLISHED",
        },
      }),

      // Completed assignments
      this.prisma.jobAssignment.count({
        where: {
          status: "COMPLETED",
        },
      }),

      // Recent workers
      this.prisma.worker.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          workerCode: true,
          experienceYears: true,
          verificationStatus: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          skills: {
            take: 1,
            select: {
              skill: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),

      // Recent verification requests
      this.prisma.verificationRequest.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          status: true,
          overallScore: true,
          createdAt: true,
          worker: {
            select: {
              workerCode: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),

      // Verification status overview
      this.prisma.verificationRequest.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      // Registrations for the last 30 days
      this.prisma.worker.findMany({
        where: {
          createdAt: {
            gte: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000,
            ),
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

    return {
      stats: {
        totalWorkers,
        verifiedWorkers,
        totalEmployers,
        activeJobs,
        completedJobs,
      },

      recentWorkers: recentWorkers.map(
        (worker) => ({
          id: worker.id,
          workerCode: worker.workerCode,
          name: [
            worker.user.firstName,
            worker.user.lastName,
          ]
            .filter(Boolean)
            .join(" "),
          phone: worker.user.phone,
          skill:
            worker.skills[0]?.skill.name ?? null,
          experienceYears:
            worker.experienceYears
              ? Number(worker.experienceYears)
              : null,
          verificationStatus:
            worker.verificationStatus,
          createdAt: worker.createdAt,
        }),
      ),

      recentVerifications:
        recentVerifications.map(
          (verification) => ({
            id: verification.id,
            workerCode:
              verification.worker.workerCode,
            workerName: [
              verification.worker.user.firstName,
              verification.worker.user.lastName,
            ]
              .filter(Boolean)
              .join(" "),
            status: verification.status,
            score: verification.overallScore,
            createdAt: verification.createdAt,
          }),
        ),

      verificationOverview:
        verificationOverview.map(
          (item) => ({
            status: item.status,
            count: item._count._all,
          }),
        ),

      registrations:
        this.buildRegistrationChart(
          registrations.map(
            (item) => item.createdAt,
          ),
        ),
    };
  }

  private buildRegistrationChart(
    dates: Date[],
  ) {
    const result: Record<
      string,
      number
    > = {};

    for (const date of dates) {
      const key = date
        .toISOString()
        .slice(0, 10);

      result[key] = (result[key] ?? 0) + 1;
    }

    return Object.entries(result).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );
  }
}