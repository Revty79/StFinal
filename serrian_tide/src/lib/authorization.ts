/**
 * Centralized authorization utilities for role-based access control
 * 
 * Role Hierarchy (highest to lowest):
 * 1. admin - Full system access, sees everything, can do anything
 * 2. privileged - Enhanced access, batch uploads, sees own + free content
 * 3. universe_creator - Can create worlds, sees own + free content
 * 4. world_developer - Can develop worlds, sees own + free content
 * 5. world_builder - Can build worlds, sees own + free content
 * 6. free - Basic access, sees only free content
 */

export type UserRole = 
  | 'admin'
  | 'privileged'
  | 'universe_creator'
  | 'world_developer'
  | 'world_builder'
  | 'free';

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  role: string;
}

/**
 * Role capabilities
 */
export function getRoleCapabilities(role: string | null | undefined) {
  const r = (role ?? '').toLowerCase();

  return {
    // Full system access
    isAdmin: r === 'admin',
    
    // Can upload batch content (admin only)
    canBatchUpload: r === 'admin',
    
    // Can see all content (admin only)
    canSeeAllContent: r === 'admin',
    
    // Can access worldbuilder
    canWorldBuild: [
      'admin',
      'privileged',
      'universe_creator',
      'world_developer',
      'world_builder'
    ].includes(r),
    
    // Can publish/sell content
    canPublish: [
      'admin',
      'universe_creator',
      'world_developer'
    ].includes(r),
    
    // Has elevated permissions (admin + privileged)
    hasElevatedAccess: ['admin', 'privileged'].includes(r),
    
    // Can access Source Forge
    canAccessSourceForge: ['admin', 'privileged'].includes(r),
    
    // Can see admin panel
    canSeeAdmin: r === 'admin',
  };
}

/**
 * Check if user can view a resource
 * Admin can view everything
 * Others can view their own content or free content
 */
export function canViewResource(
  user: AuthUser,
  resource: { createdBy: string; isFree?: boolean }
): boolean {
  const { isAdmin } = getRoleCapabilities(user.role);
  
  if (isAdmin) return true;
  if (resource.createdBy === user.id) return true;
  if (resource.isFree) return true;
  
  return false;
}

/**
 * Check if user can edit a resource
 * Admin can edit everything
 * Others can only edit their own content
 */
export function canEditResource(
  user: AuthUser,
  resource: { createdBy: string }
): boolean {
  const { isAdmin } = getRoleCapabilities(user.role);
  
  if (isAdmin) return true;
  if (resource.createdBy === user.id) return true;
  
  return false;
}

/**
 * Check if user can delete a resource
 * Same as edit permissions
 */
export function canDeleteResource(
  user: AuthUser,
  resource: { createdBy: string }
): boolean {
  return canEditResource(user, resource);
}

/**
 * Get SQL WHERE clause for listing resources
 * Admin sees everything
 * Others see their own + free content
 */
export function getResourceListCondition(userId: string, role: string): {
  sql: string;
  params: any[];
} {
  const { isAdmin } = getRoleCapabilities(role);
  
  if (isAdmin) {
    return {
      sql: '',
      params: []
    };
  }
  
  return {
    sql: 'WHERE created_by = $1 OR is_free = true',
    params: [userId]
  };
}

/**
 * Get SQL WHERE clause for getting a single resource
 * Admin can access anything
 * Others need to own it or it must be free
 */
export function getResourceAccessCondition(
  userId: string,
  role: string,
  resourceId: string
): {
  sql: string;
  params: any[];
} {
  const { isAdmin } = getRoleCapabilities(role);
  
  if (isAdmin) {
    return {
      sql: 'WHERE id = $1',
      params: [resourceId]
    };
  }
  
  return {
    sql: 'WHERE id = $1 AND (created_by = $2 OR is_free = true)',
    params: [resourceId, userId]
  };
}

/**
 * Get SQL WHERE clause for editing a resource
 * Admin can edit anything
 * Others can only edit their own
 */
export function getResourceEditCondition(
  userId: string,
  role: string,
  resourceId: string
): {
  sql: string;
  params: any[];
} {
  const { isAdmin } = getRoleCapabilities(role);
  
  if (isAdmin) {
    return {
      sql: 'WHERE id = $1',
      params: [resourceId]
    };
  }
  
  return {
    sql: 'WHERE id = $1 AND created_by = $2',
    params: [resourceId, userId]
  };
}

/**
 * Require specific role
 */
export function requireRole(user: AuthUser, requiredRole: UserRole): boolean {
  return user.role === requiredRole;
}

/**
 * Require minimum role level
 */
export function requireMinimumRole(user: AuthUser, minimumRole: UserRole): boolean {
  const roleHierarchy: UserRole[] = [
    'admin',
    'privileged',
    'universe_creator',
    'world_developer',
    'world_builder',
    'free'
  ];
  
  const userLevel = roleHierarchy.indexOf(user.role as UserRole);
  const requiredLevel = roleHierarchy.indexOf(minimumRole);
  
  // Lower index = higher privilege
  return userLevel !== -1 && userLevel <= requiredLevel;
}
