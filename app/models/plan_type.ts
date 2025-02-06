import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import SavingType from '#models/saving_type'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Plan from '#models/plan'

export default class PlanType extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare interestRate: number

  @column()
  declare savingTypeId: number

  @belongsTo(() => SavingType)
  declare savingType: BelongsTo<typeof SavingType>

  @hasMany(() => Plan)
  declare plans: HasMany<typeof Plan>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}