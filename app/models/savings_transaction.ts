import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations';
import Plan from '#models/plan';
import Saving from '#models/plan_subcriber';
import User from '#models/user';

export default class SavingsTransaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number


  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => Saving)
  declare saving: BelongsTo<typeof Saving>;

  @belongsTo(() => Plan)
  declare plan: BelongsTo<typeof Plan>;

  @column()
  declare userId: number;

  @column()
  declare savingsId: number;

  @column()
  declare amount: number;

  @column()
  declare transactionType: 'DEPOSIT' | 'WITHDRAWAL';

  @column()
  declare reference: string;

  @column.dateTime({ autoCreate: true })
  declare transactionDate: DateTime;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}