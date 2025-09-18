// libs/data/src/lib/interfaces/user.interface.ts

export enum RoleType {
    OWNER = 'owner',
    ADMIN = 'admin',
    VIEWER = 'viewer',
  }
  
  export interface IRole {
    id: string;
    name: string;
    type: RoleType;
    description?: string;
    hierarchy: number;
    isActive: boolean;
    permissions?: IPermission[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export enum PermissionAction {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    MANAGE = 'manage',
  }
  
  export enum PermissionResource {
    TASK = 'task',
    USER = 'user',
    ORGANIZATION = 'organization',
    AUDIT_LOG = 'audit_log',
    ALL = '*',
  }
  
  export interface IPermission {
    id: string;
    name: string;
    action: PermissionAction;
    resource: PermissionResource;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface IOrganization {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    parentId?: string;
    parent?: IOrganization;
    children?: IOrganization[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface IUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    lastLoginAt?: Date;
    organizationId: string;
    roleId: string;
    organization?: IOrganization;
    role?: IRole;
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Auth-related interfaces
  export interface IAuthUser extends Omit<IUser, 'password'> {
    fullName: string;
    permissions: string[];
  }
  
  export interface ILoginRequest {
    email: string;
    password: string;
  }
  
  export interface ILoginResponse {
    accessToken: string;
    user: IAuthUser;
    expiresIn: number;
  }
  
  export interface IJwtPayload {
    sub: string; // user id
    email: string;
    organizationId: string;
    roleId: string;
    permissions: string[];
    iat?: number;
    exp?: number;
  }
  
  export interface ICreateUserRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    organizationId: string;
    roleId: string;
  }
  
  export interface IUpdateUserRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    isActive?: boolean;
    organizationId?: string;
    roleId?: string;
  }