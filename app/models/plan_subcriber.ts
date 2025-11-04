
import { DateTime } from 'luxon';
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm';
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user';
import Plan from '#models/plan';
import PlanTransaction from '#models/plans_transaction';

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
  declare interestEarned: number;

  @hasMany(() => PlanSubscriber, {
    foreignKey: 'planId',
  })
  declare otherSubscribers: HasMany<typeof PlanSubscriber>


  // plan subscriber has many plantransaction throught plan id
  @hasMany(() => PlanTransaction, {
    foreignKey: 'planId',
    localKey: 'planId',
  })
  declare transactions: HasMany<typeof PlanTransaction>

  @column()
  declare currentAmount: number;

  @column.date()
  declare startDate: DateTime;

  @column()
  declare subscriptionCode: string;

  @column()
  declare emailToken: string;

  @column.date()
  declare endDate: DateTime;

  @column()
  declare locked: boolean;

  @column()
  declare status: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
