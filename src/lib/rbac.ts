import type { Role } from '@/lib/enums'

export type Action =
  | 'users.manage'
  | 'styles.write'
  | 'customers.write'
  | 'suppliers.write'
  | 'locations.write'
  | 'masters.read'
  | 'sales.write'
  | 'sales.read'
  | 'payments.write'
  | 'inventory.write'
  | 'inventory.read'

const MATRIX: Record<Action, Role[]> = {
  'users.manage': ['OWNER', 'ADMIN'],
  'styles.write': ['OWNER', 'ADMIN', 'INVENTORY'],
  'customers.write': ['OWNER', 'ADMIN', 'SALES', 'ACCOUNTANT'],
  'suppliers.write': ['OWNER', 'ADMIN', 'INVENTORY', 'ACCOUNTANT'],
  'locations.write': ['OWNER', 'ADMIN', 'SALES', 'INVENTORY'],
  'masters.read': ['OWNER', 'ADMIN', 'SALES', 'INVENTORY', 'ACCOUNTANT', 'PARTNER'],
  'sales.write': ['OWNER', 'ADMIN', 'SALES'],
  'sales.read': ['OWNER', 'ADMIN', 'SALES', 'ACCOUNTANT', 'PARTNER'],
  'payments.write': ['OWNER', 'ADMIN', 'SALES', 'ACCOUNTANT'],
  'inventory.write': ['OWNER', 'ADMIN', 'INVENTORY'],
  'inventory.read': ['OWNER', 'ADMIN', 'INVENTORY', 'ACCOUNTANT', 'PARTNER'],
}

export const can = (role: Role, action: Action): boolean => MATRIX[action].includes(role)
