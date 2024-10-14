import { DateTime } from 'luxon'
import { column, BaseModel, hasOne, hasMany, hasManyThrough, belongsTo } from '@adonisjs/lucid/orm'

export default class Withdrawal extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare amount: number

  @column()
  declare status: string

  @column()
  declare reference: string

  @column()
  declare recipientCode: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}