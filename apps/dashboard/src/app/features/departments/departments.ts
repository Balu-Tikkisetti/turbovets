// Department-related types and interfaces
export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface DepartmentMember {
  id: string;
  departmentId: string;
  userId: string;
  role: string;
}
