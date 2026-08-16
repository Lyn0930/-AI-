import { Injectable, Inject, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { cityAssignments } from '@server/database/schema';
import { eq, and } from 'drizzle-orm';
import type {
  CityAssignment,
  CreateCityAssignmentRequest,
  UpdateCityAssignmentRequest,
} from '@shared/api.interface';

function mapToAssignment(row: typeof cityAssignments.$inferSelect): CityAssignment {
  return {
    id: row.id,
    serviceCity: row.serviceCity,
    assigneeId: row.assigneeId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(): Promise<CityAssignment[]> {
    const rows = await this.db.select().from(cityAssignments).orderBy(cityAssignments.serviceCity);
    return rows.map(mapToAssignment);
  }

  async create(data: CreateCityAssignmentRequest): Promise<CityAssignment> {
    const existing = await this.db
      .select()
      .from(cityAssignments)
      .where(and(
        eq(cityAssignments.serviceCity, data.serviceCity),
        eq(cityAssignments.assigneeId, data.assigneeId),
      ))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`城市「${data.serviceCity}」已分配该客服`);
    }

    const [row] = await this.db
      .insert(cityAssignments)
      .values({
        serviceCity: data.serviceCity,
        assigneeId: data.assigneeId,
      })
      .returning();

    return mapToAssignment(row);
  }

  async update(id: string, data: UpdateCityAssignmentRequest): Promise<CityAssignment> {
    const updateData: Partial<{ serviceCity: string; assigneeId: string }> = {};
    if (data.serviceCity !== undefined) updateData.serviceCity = data.serviceCity;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;

    const [row] = await this.db
      .update(cityAssignments)
      .set(updateData)
      .where(eq(cityAssignments.id, id))
      .returning();

    if (!row) {
      throw new NotFoundException(`分配映射 ${id} 不存在`);
    }

    return mapToAssignment(row);
  }

  async getAgentsByCity(city: string): Promise<string[]> {
    const rows = await this.db
      .select({ assigneeId: cityAssignments.assigneeId })
      .from(cityAssignments)
      .where(eq(cityAssignments.serviceCity, city));
    return rows.map((r: { assigneeId: string }) => r.assigneeId);
  }

  async remove(id: string): Promise<void> {
    const [row] = await this.db
      .delete(cityAssignments)
      .where(eq(cityAssignments.id, id))
      .returning({ id: cityAssignments.id });

    if (!row) {
      throw new NotFoundException(`分配映射 ${id} 不存在`);
    }
  }
}
