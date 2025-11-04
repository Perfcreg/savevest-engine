import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations';
import Plan from '#models/plan';
import User from '#models/user';

export default class PlanTransaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number
  
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => Plan)
  declare plan: BelongsTo<typeof Plan>;

  @column()
  declare userId: number;

  @column()
  declare planId: number;

  @column()
  declare amount: number;

  @column()
  declare transactionType: string;

  @column()
  declare receiptId: string;

  @column()
  declare transactionId: string;

  @column()
  declare metadata: string | null;

  @column()
  declare status: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}