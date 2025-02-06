import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'

export default class IsAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.unauthorized('Authentication required')
    }

    const userWithRole = await User.query().where('id', user.id).preload('role').first()

    if (!userWithRole || userWithRole.role.name !== 'admin') {
      return ctx.response.forbidden('Access denied: Admin privileges required')
    }

    return next()
  }
}