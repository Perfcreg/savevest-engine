import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Plan from '#models/plan'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class PlanTransaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userPlanId: number

  @column()
  declare userId: number

  @column()
  declare amount: number

  @column()
  declare transactionId: string

  @column()
  declare receiptId: string

  @column()
  declare transactionType: string

  @belongsTo(() => Plan)
  declare plan: BelongsTo<typeof Plan>;
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}