import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ZohoCallBudgetExceededException,
  ZohoCircuitBreakerException,
} from './zoho.exceptions';
import {
  ZohoApiUsage,
  ZohoApiUsageChannel,
  ZohoApiUsageDocument,
} from './zoho-api-usage.entity';

function usageDateKey(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Injectable()
export class ZohoApiBudgetService implements OnModuleInit {
  private readonly logger = new Logger(ZohoApiBudgetService.name);

  constructor(
    @InjectModel(ZohoApiUsage.name)
    private readonly usageModel: Model<ZohoApiUsageDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.usageModel.collection.dropIndex('date_1');
    } catch {
      // Legacy unique index may not exist.
    }
    await this.usageModel.syncIndexes();
  }

  private get syncBudget(): number {
    const raw = process.env.ZOHO_BUDGET_SYNC;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
    return 400;
  }

  private get orderBudget(): number {
    const raw = process.env.ZOHO_BUDGET_ORDER;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
    return 500;
  }

  private get totalBudget(): number {
    const raw = process.env.ZOHO_DAILY_CALL_BUDGET;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
    return 900;
  }

  private channelBudget(channel: ZohoApiUsageChannel): number {
    return channel === 'sync' ? this.syncBudget : this.orderBudget;
  }

  async incrementAndAssertWithinBudget(
    channel: ZohoApiUsageChannel,
    operation: string,
  ): Promise<{ date: string; channel: ZohoApiUsageChannel; count: number; budget: number; total: number }> {
    const date = usageDateKey();
    const counts = await this.usageModel
      .find({ date })
      .lean()
      .exec();
    const totalBefore = counts.reduce((sum, row) => sum + Number(row.count ?? 0), 0);
    if (totalBefore >= this.totalBudget) {
      throw new ZohoCircuitBreakerException(
        `Zoho circuit breaker is open (total=${totalBefore}, limit=${this.totalBudget}).`,
        totalBefore,
      );
    }

    const doc = await this.usageModel
      .findOneAndUpdate(
        { date, channel },
        { $inc: { count: 1 }, $setOnInsert: { date, channel } },
        { upsert: true, new: true },
      )
      .lean()
      .exec();

    const count = Number(doc?.count ?? 0);
    const budget = this.channelBudget(channel);
    if (count > budget) {
      throw new ZohoCallBudgetExceededException(
        `Zoho API channel budget exceeded (channel=${channel}, count=${count}, budget=${budget}, operation=${operation}).`,
        count,
        budget,
      );
    }
    const total = totalBefore + 1;
    if (total > this.totalBudget) {
      throw new ZohoCircuitBreakerException(
        `Zoho circuit breaker is open (total=${total}, limit=${this.totalBudget}).`,
        total,
      );
    }
    if (count >= Math.floor(budget * 0.9)) {
      this.logger.warn(
        `Zoho API ${channel} budget is high for ${date}: ${count}/${budget} calls used`,
      );
    }
    return { date, channel, count, budget, total };
  }

  async getTodayUsage(): Promise<{
    date: string;
    total: number;
    totalBudget: number;
    sync: { count: number; budget: number };
    order: { count: number; budget: number };
  }> {
    const date = usageDateKey();
    const docs = await this.usageModel.find({ date }).lean().exec();
    const syncCount = Number(
      docs.find((d) => d.channel === 'sync')?.count ?? 0,
    );
    const orderCount = Number(
      docs.find((d) => d.channel === 'order')?.count ?? 0,
    );
    return {
      date,
      total: syncCount + orderCount,
      totalBudget: this.totalBudget,
      sync: { count: syncCount, budget: this.syncBudget },
      order: { count: orderCount, budget: this.orderBudget },
    };
  }
}
