import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { workers, workerSkills, workerAvailability } from '@server/database/schema';
import { eq, and, count, desc, ilike, or } from 'drizzle-orm';
import type {
  Worker,
  WorkerSkill,
  WorkerAvailability,
  WorkerDetail,
  WorkerListParams,
  WorkerListResponse,
  CreateWorkerRequest,
  UpdateWorkerRequest,
  CreateWorkerSkillRequest,
  CreateWorkerAvailabilityRequest,
} from '@shared/api.interface';

function mapToWorker(row: typeof workers.$inferSelect): Worker {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    gender: row.gender as Worker['gender'],
    serviceCity: row.serviceCity,
    serviceType: row.serviceType,
    level: row.level as Worker['level'],
    status: row.status as Worker['status'],
    rating: row.rating,
    totalOrders: row.totalOrders,
    avatar: row.avatar,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapToSkill(row: typeof workerSkills.$inferSelect): WorkerSkill {
  return {
    id: row.id,
    workerId: row.workerId,
    skillTag: row.skillTag,
    proficiency: row.proficiency as WorkerSkill['proficiency'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapToAvailability(row: typeof workerAvailability.$inferSelect): WorkerAvailability {
  return {
    id: row.id,
    workerId: row.workerId,
    date: row.date,
    timeSlot: row.timeSlot,
    status: row.status as WorkerAvailability['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class WorkersService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async list(params: WorkerListParams): Promise<WorkerListResponse> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(Math.max(1, params.pageSize ?? 10), 50);

    const conditions = [];
    if (params.serviceCity) {
      conditions.push(eq(workers.serviceCity, params.serviceCity));
    }
    if (params.serviceType) {
      conditions.push(eq(workers.serviceType, params.serviceType));
    }
    if (params.status) {
      conditions.push(eq(workers.status, params.status));
    }
    if (params.level) {
      conditions.push(eq(workers.level, params.level));
    }
    if (params.keyword) {
      const kw = or(
        ilike(workers.name, `%${params.keyword}%`),
        ilike(workers.phone, `%${params.keyword}%`),
      );
      if (kw) conditions.push(kw);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(workers)
      .where(whereClause);
    const total = Number(totalResult[0]?.count ?? 0);

    const rows = await this.db
      .select()
      .from(workers)
      .where(whereClause)
      .orderBy(desc(workers.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize);

    return { items: rows.map(mapToWorker), total, page, pageSize };
  }

  async getById(id: string): Promise<WorkerDetail> {
    const workerRows = await this.db.select().from(workers).where(eq(workers.id, id));
    if (workerRows.length === 0) {
      throw new NotFoundException(`劳动者 ${id} 不存在`);
    }
    const skillRows = await this.db
      .select()
      .from(workerSkills)
      .where(eq(workerSkills.workerId, id));
    const availRows = await this.db
      .select()
      .from(workerAvailability)
      .where(eq(workerAvailability.workerId, id))
      .orderBy(desc(workerAvailability.date));

    return {
      ...mapToWorker(workerRows[0]),
      skills: skillRows.map(mapToSkill),
      availabilities: availRows.map(mapToAvailability),
    };
  }

  async create(dto: CreateWorkerRequest): Promise<Worker> {
    const rows = await this.db.insert(workers).values({
      name: dto.name,
      phone: dto.phone,
      gender: dto.gender ?? 'male',
      serviceCity: dto.serviceCity,
      serviceType: dto.serviceType,
      level: dto.level ?? 'junior',
      status: dto.status ?? 'active',
      rating: dto.rating ?? 0,
      totalOrders: dto.totalOrders ?? 0,
      avatar: dto.avatar ?? null,
    }).returning();
    return mapToWorker(rows[0]);
  }

  async update(id: string, dto: UpdateWorkerRequest): Promise<Worker> {
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.serviceCity !== undefined) updateData.serviceCity = dto.serviceCity;
    if (dto.serviceType !== undefined) updateData.serviceType = dto.serviceType;
    if (dto.level !== undefined) updateData.level = dto.level;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.rating !== undefined) updateData.rating = dto.rating;
    if (dto.totalOrders !== undefined) updateData.totalOrders = dto.totalOrders;
    if (dto.avatar !== undefined) updateData.avatar = dto.avatar;

    const rows = await this.db
      .update(workers)
      .set(updateData)
      .where(eq(workers.id, id))
      .returning();
    if (rows.length === 0) {
      throw new NotFoundException(`劳动者 ${id} 不存在`);
    }
    return mapToWorker(rows[0]);
  }

  async remove(id: string): Promise<void> {
    const rows = await this.db
      .delete(workers)
      .where(eq(workers.id, id))
      .returning({ id: workers.id });
    if (rows.length === 0) {
      throw new NotFoundException(`劳动者 ${id} 不存在`);
    }
  }

  async addSkill(workerId: string, dto: CreateWorkerSkillRequest): Promise<WorkerSkill> {
    const rows = await this.db.insert(workerSkills).values({
      workerId,
      skillTag: dto.skillTag,
      proficiency: dto.proficiency ?? 'intermediate',
    }).returning();
    return mapToSkill(rows[0]);
  }

  async removeSkill(workerId: string, skillId: string): Promise<void> {
    const rows = await this.db
      .delete(workerSkills)
      .where(and(eq(workerSkills.id, skillId), eq(workerSkills.workerId, workerId)))
      .returning({ id: workerSkills.id });
    if (rows.length === 0) {
      throw new NotFoundException(`技能 ${skillId} 不存在`);
    }
  }

  async addAvailability(workerId: string, dto: CreateWorkerAvailabilityRequest): Promise<WorkerAvailability> {
    const rows = await this.db.insert(workerAvailability).values({
      workerId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      status: dto.status ?? 'available',
    }).returning();
    return mapToAvailability(rows[0]);
  }

  async removeAvailability(workerId: string, availabilityId: string): Promise<void> {
    const rows = await this.db
      .delete(workerAvailability)
      .where(and(eq(workerAvailability.id, availabilityId), eq(workerAvailability.workerId, workerId)))
      .returning({ id: workerAvailability.id });
    if (rows.length === 0) {
      throw new NotFoundException(`可用时间 ${availabilityId} 不存在`);
    }
  }
}
