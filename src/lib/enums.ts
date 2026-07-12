import { z } from 'zod'

export const ROLES = ['OWNER', 'PARTNER', 'SALES', 'INVENTORY', 'ACCOUNTANT', 'ADMIN'] as const
export const RoleEnum = z.enum(ROLES)
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Owner',
  PARTNER: 'Partner / Investor',
  SALES: 'Sales Operator',
  INVENTORY: 'Inventory Clerk',
  ACCOUNTANT: 'Accountant',
  ADMIN: 'System Admin',
}

export const GENDER_GROUPS = ['Mens', 'Ladies', 'Boys', 'Girls', 'Kids', 'Unisex'] as const
export const SEASONS = ['Winter', 'Summer', 'All'] as const
export const GRADES = ['A', 'B-Grade', 'C-Grade', 'Mixed'] as const
