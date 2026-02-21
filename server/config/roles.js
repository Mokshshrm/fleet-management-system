export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  FLEET_MANAGER: 'fleet_manager',
  DISPATCHER: 'dispatcher',
  SAFETY_OFFICER: 'safety_officer',
  FINANCIAL_ANALYST: 'financial_analyst',
  DRIVER: 'driver'
};

export const ROLE_HIERARCHY = {
  owner: 6,
  admin: 5,
  fleet_manager: 4,
  safety_officer: 3,
  financial_analyst: 3,
  dispatcher: 2,
  driver: 1
};

export const hasRole = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};
