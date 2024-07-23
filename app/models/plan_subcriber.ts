
import { DateTime } from 'luxon';
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import User from '#models/user';
import Plan from '#models/plan';

export default class PlanSubscriber extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @column()
  declare planId: number;

  @belongsTo(() => Plan)
  declare plan: BelongsTo<typeof Plan>;

  @column()
  declare currentAmount: number;

  @column.date()
  declare startDate: DateTime;

  @column.date()
  declare endDate: DateTime;

  @column()
  declare locked: boolean;

  @column({
    consume: (value: string) => value as 'Active' | 'Completed' | 'Cancelled',
  })
  declare status: 'Active' | 'Completed' | 'Cancelled';

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
