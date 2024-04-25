import { DateTime } from 'luxon';
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import User from '#models/user';

export default class Plan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare description: string;

  @column({
    consume: (value: string) => value as 'SAVING' | 'AJO' | 'PERSONAL' | 'GROUP',
  })
  declare planType: 'SAVING' | 'AJO' | 'PERSONAL' | 'GROUP';

  @column()
  declare amount: number;

  @column()
  declare planCode: string;

  @column()
  declare targetAmount: number;

  @column()
  declare userId: number;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @column.date()
  declare startDate: DateTime;

  @column.date()
  declare endDate: DateTime;
  
  @column({
    consume: (value: string) => value as 'DAILY' | 'WEEKLY' | 'MONTHLY',
  })
  declare interval: 'DAILY' | 'WEEKLY' | 'MONTHLY' ;


  @column()
  declare interestRate: number;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
