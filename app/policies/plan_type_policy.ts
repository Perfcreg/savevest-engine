import User from '#models/user'
import PlanType from '#models/plan_type'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PlanTypePolicy extends BasePolicy {
  
    view(user: User, planType: PlanType): AuthorizerResponse {
        // Allow all roles to view planTypes
        return true
      }
    
      create(user: User): AuthorizerResponse {
        // Only admin and editor roles can create planTypes
        return user?.role.name === 'admin' || user.role.name === 'editor'
      }
    
      update(user: User, planType: PlanType): AuthorizerResponse {
        // Only admin and the owner of the planType can update it
        return user.role.name === 'admin'
      }
    
      delete(user: User, planType: PlanType): AuthorizerResponse {
        // Only admin can delete planTypes
        return user.role.name === 'admin'
      }
}