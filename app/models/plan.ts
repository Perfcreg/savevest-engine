import { DateTime } from 'luxon';
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm';
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user';
import PlanType from '#models/plan_type';
import PlanTransaction from '#models/plan_transaction';

export default class UserPlan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare description: string;

  @column()
  declare amount: number;

  @column()
  declare planCode: string;

  @column()
  declare targetAmount: number;

  @column()
  declare userId: number;

  @column.date()
  declare startDate: DateTime;

  @column.date()
  declare endDate: DateTime;
  
  @column({
    consume: (value: string) => value as 'DAILY' | 'WEEKLY' | 'MONTHLY',
  })
  declare interval: 'DAILY' | 'WEEKLY' | 'MONTHLY' ;

  @column()
  declare interesEarned: number;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => PlanType)
  declare planType: BelongsTo<typeof PlanType>

  @hasMany(() => PlanTransaction)
  declare planTransactions: HasMany<typeof PlanTransaction>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
