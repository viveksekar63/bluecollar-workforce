import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployerApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async getDetails(userId: string, applicationId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true, status: true, companyName: true },
    });

    if (!employer) throw new NotFoundException('Employer profile not found');
    if (String(employer.status) !== 'VERIFIED') {
      throw new BadRequestException('Employer account is not verified');
    }

    const application = await this.prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        job: { employerId: employer.id },
      },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        shortlistedAt: true,
        rejectedAt: true,
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            city: true,
            district: true,
            state: true,
            pincode: true,
            salaryMin: true,
            salaryMax: true,
            salaryType: true,
            openings: true,
            startDate: true,
            endDate: true,
            status: true,
            skills: { include: { skill: true } },
          },
        },
        worker: {
          select: {
            id: true,
            workerCode: true,
            dateOfBirth: true,
            gender: true,
            maritalStatus: true,
            bio: true,
            experienceYears: true,
            professionCategory: true,
            profession: true,
            profileCompletion: true,
            verificationStatus: true,
            verificationScore: true,
            availabilityStatus: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profilePhotoUrl: true,
                status: true,
              },
            },
            addresses: {
              orderBy: { createdAt: 'desc' },
              take: 3,
              select: {
                id: true,
                type: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                district: true,
                state: true,
                pincode: true,
                isCurrent: true,
              },
            },
            skills: {
              orderBy: { skillLevel: 'desc' },
              include: { skill: true },
            },
            education: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                qualification: true,
                institution: true,
                fieldOfStudy: true,
                startYear: true,
                endYear: true,
                verified: true,
              },
            },
            certifications: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                name: true,
                issuingBody: true,
                certificateNo: true,
                issuedDate: true,
                expiryDate: true,
                verified: true,
              },
            },
            languages: {
              include: { language: true },
            },
            employmentHistory: {
              orderBy: { startDate: 'desc' },
              select: {
                id: true,
                companyName: true,
                companyAddress: true,
                designation: true,
                startDate: true,
                endDate: true,
                salary: true,
                employmentType: true,
                reasonForLeaving: true,
                verificationStatus: true,
                references: {
                  select: {
                    id: true,
                    name: true,
                    designation: true,
                    relationship: true,
                    verificationStatus: true,
                  },
                },
                documents: {
                  select: {
                    document: {
                      select: {
                        id: true,
                        type: true,
                        fileName: true,
                        mimeType: true,
                        fileSize: true,
                        documentNumber: true,
                        verificationStatus: true,
                        uploadedAt: true,
                        verifiedAt: true,
                      },
                    },
                  },
                },
              },
            },
            documents: {
              orderBy: { uploadedAt: 'desc' },
              select: {
                id: true,
                type: true,
                fileName: true,
                mimeType: true,
                fileSize: true,
                documentNumber: true,
                verificationStatus: true,
                uploadedAt: true,
                verifiedAt: true,
                verification: {
                  select: {
                    provider: true,
                    status: true,
                    remarks: true,
                    verifiedAt: true,
                  },
                },
              },
            },
            verificationRequests: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                overallScore: true,
                startedAt: true,
                completedAt: true,
                createdAt: true,
                checks: {
                  orderBy: { createdAt: 'asc' },
                  select: {
                    id: true,
                    type: true,
                    status: true,
                    provider: true,
                    startedAt: true,
                    completedAt: true,
                    result: {
                      select: {
                        result: true,
                        score: true,
                        remarks: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!application) throw new NotFoundException('Application not found');

    return application;
  }
}
