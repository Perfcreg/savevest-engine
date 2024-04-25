import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations';
import Plan from '#models/plan';
import Saving from '#models/saving';
import User from '#models/user';

export default class SavingsTransaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => Saving)
  declare wallet: BelongsTo<typeof Saving>;

  @column()
  declare userId: number;

  @column()
  declare walletId: number;

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