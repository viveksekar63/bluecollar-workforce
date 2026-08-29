import { IsUUID } from 'class-validator';

export class WorkerIdParamDto {
  @IsUUID()
  workerId!: string;
}

export class ShortlistPageDto {
  page?: number;
  limit?: number;
}
