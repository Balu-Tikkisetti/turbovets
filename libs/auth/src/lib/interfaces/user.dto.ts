import { Role } from '../enums/role.enum';

export interface UserDto {
  id: string;
  username: string;
  email: string;
  role: Role;
  department?: string;
}

