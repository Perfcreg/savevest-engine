import { DateTime } from 'luxon'
import { withAuthFinder } from '@adonisjs/auth'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { BelongsTo, HasMany, HasManyThrough, HasOne } from '@adonisjs/lucid/types/relations'
import { column, BaseModel, hasOne, hasMany, hasManyThrough, belongsTo } from '@adonisjs/lucid/orm'
import Wallet from '#models/wallet'
import Plan from '#models/plan'
import Saving from '#models/plan_subcriber'
import SavingsTransaction from '#models/savings_transaction'
import WalletTransaction from '#models/wallet_transaction'
import Role from '#models/role'
import UserBank from '#models/user_bank'


// import Plan from '#models/plan'


const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare role_id: number

  @column()
  declare fullName: string

  @column()
  declare email: string

  @column({serializeAs: null})
  declare password: string

  @column()
  declare username: string

  @column()
  declare paystack_id: string

  @column()
  declare phone: string

  @column()
  declare dob: string

  @column()
  declare token: string

  @column()
  declare referal_by: string

  @column()
  declare referal: string

  @column()
  declare bvn: string

  @column()
  declare pin: string

  @column()
  declare kyc: boolean

  @column()
  declare gender: string

  @column()
  declare next_of_kin: string

  @column()
  declare picture: string

  @column()
  declare fa : boolean

  @column({serializeAs: null})
  declare isActive : boolean

  @column()
  declare inactivePermantely : boolean

  @hasOne(() => Wallet, {
    foreignKey: 'user_id', 
  })
  wallet!: HasOne<typeof Wallet>

  @belongsTo(() => Role, {
    foreignKey: 'role_id',
  })
  role!: BelongsTo<typeof Role>

  @belongsTo(() => User, {
    foreignKey: 'referal_by',
  })
  referedBy!: BelongsTo<typeof User>

  @hasMany(() => User, {
    foreignKey: 'referal_by',
  })
  refers!: HasMany<typeof User>

  @hasMany(() => Plan, {
    foreignKey: 'user_id',
  })
  plan!: HasMany<typeof Plan>

  @hasMany(() => UserBank, {
    foreignKey: 'user_id',
  })
  bank!: HasMany<typeof UserBank>

  @hasManyThrough([() => SavingsTransaction, () => Saving])
  declare savingsTransaction: HasManyThrough<typeof SavingsTransaction>
 
  @hasManyThrough([() => WalletTransaction, () => Wallet])
  declare walletTransaction: HasManyThrough<typeof WalletTransaction>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '2 days',
    prefix: 'svt_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })
}