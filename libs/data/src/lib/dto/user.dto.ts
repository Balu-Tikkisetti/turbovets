export interface UserDto {
    id: string;
    username: string;
    email?: string;
    password?: string;
    role: string;
    department?: string;
    lastLoginAt?: string;
}