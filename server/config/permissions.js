export const PERMISSIONS = {
  // Company Management
  MANAGE_COMPANY: ['owner'],
  
  // User Management
  CREATE_USER: ['owner', 'admin'],
  UPDATE_USER: ['owner', 'admin'],
  DELETE_USER: ['owner', 'admin'],
  VIEW_USERS: ['owner', 'admin'],
  
  // Driver Management
  CREATE_DRIVER: ['owner', 'admin'],
  UPDATE_DRIVER: ['owner', 'admin'],
  DELETE_DRIVER: ['owner', 'admin'],
  VIEW_DRIVERS: ['owner', 'admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'],
  VIEW_DRIVER_PERFORMANCE: ['owner', 'admin', 'fleet_manager', 'safety_officer'],
  UPDATE_DRIVER_SAFETY: ['owner', 'admin', 'safety_officer'],
  
  // Vehicle Management
  CREATE_VEHICLE: ['owner', 'admin', 'fleet_manager'],
  UPDATE_VEHICLE: ['owner', 'admin', 'fleet_manager'],
  DELETE_VEHICLE: ['owner', 'admin'],
  VIEW_VEHICLES: ['owner', 'admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'],
  
  // Trip Management
  CREATE_TRIP: ['owner', 'admin', 'fleet_manager', 'dispatcher'],
  UPDATE_TRIP: ['owner', 'admin', 'fleet_manager', 'dispatcher'],
  DELETE_TRIP: ['owner', 'admin', 'fleet_manager'],
  VIEW_TRIPS: ['owner', 'admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'],
  START_END_TRIP: ['owner', 'admin', 'fleet_manager', 'dispatcher', 'driver'],
  
  // Maintenance Management
  CREATE_MAINTENANCE: ['owner', 'admin', 'fleet_manager', 'safety_officer'],
  UPDATE_MAINTENANCE: ['owner', 'admin', 'fleet_manager', 'safety_officer'],
  DELETE_MAINTENANCE: ['owner', 'admin', 'safety_officer'],
  VIEW_MAINTENANCE: ['owner', 'admin', 'fleet_manager', 'dispatcher', 'safety_officer'],
  
  // Fuel Management
  CREATE_FUEL: ['owner', 'admin', 'fleet_manager', 'dispatcher', 'driver'],
  UPDATE_FUEL: ['owner', 'admin', 'fleet_manager', 'financial_analyst'],
  DELETE_FUEL: ['owner', 'admin', 'financial_analyst'],
  VIEW_FUEL: ['owner', 'admin', 'fleet_manager', 'dispatcher', 'financial_analyst'],
  
  // Expense Management
  CREATE_EXPENSE: ['owner', 'admin', 'financial_analyst', 'fleet_manager'],
  UPDATE_EXPENSE: ['owner', 'admin', 'financial_analyst'],
  DELETE_EXPENSE: ['owner', 'admin', 'financial_analyst'],
  VIEW_EXPENSES: ['owner', 'admin', 'financial_analyst'],
  
  // Analytics & Reports
  VIEW_FINANCIAL_ANALYTICS: ['owner', 'admin', 'financial_analyst'],
  VIEW_FLEET_ANALYTICS: ['owner', 'admin', 'fleet_manager', 'safety_officer'],
  VIEW_DRIVER_ANALYTICS: ['owner', 'admin', 'fleet_manager', 'safety_officer'],
  VIEW_DASHBOARD: ['owner', 'admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']
};

export const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(userRole);
};

export const canAccess = (userRole, resource, action) => {
  const permission = `${action.toUpperCase()}_${resource.toUpperCase()}`;
  return hasPermission(userRole, permission);
};

// Get all permissions for a specific role
export const getUserPermissions = (userRole) => {
  const userPermissions = [];
  
  Object.entries(PERMISSIONS).forEach(([permission, allowedRoles]) => {
    if (allowedRoles.includes(userRole)) {
      userPermissions.push(permission);
    }
  });
  
  return userPermissions;
};
