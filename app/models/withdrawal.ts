import { DateTime } from 'luxon'
import { column, BaseModel, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import User from './user.js'
import UserBank from './user_bank.js'

export default class Withdrawal extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare userBankId: number

  @column()
  declare amount: number

  @column()
  declare reference: string

  @column()
  declare recipientCode: string

  @column()
  declare transferCode: string | null

  @column()
  declare transferReference: string | null

  @column()
  declare status: 'pending' | 'processing' | 'completed' | 'failed' | 'otp'

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => UserBank)
  declare userBank: BelongsTo<typeof UserBank>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}