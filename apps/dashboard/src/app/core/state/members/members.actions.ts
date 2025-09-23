import { createAction, props } from '@ngrx/store';
import { UserDto } from '@turbovets/data';

export interface MemberWithStatus extends UserDto {
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface MembersFilters {
  searchTerm: string;
  selectedRole: string;
  selectedDepartment: string;
  statusFilter: string;
}

// Load Members Actions
export const loadMembers = createAction('[Members] Load Members');
export const loadMembersSuccess = createAction(
  '[Members] Load Members Success',
  props<{ members: MemberWithStatus[] }>()
);
export const loadMembersFailure = createAction(
  '[Members] Load Members Failure',
  props<{ error: string }>()
);

// Update Member Actions
export const updateMember = createAction(
  '[Members] Update Member',
  props<{ memberId: string; updateData: { role?: string; department?: string | null } }>()
);
export const updateMemberSuccess = createAction(
  '[Members] Update Member Success',
  props<{ member: MemberWithStatus }>()
);
export const updateMemberFailure = createAction(
  '[Members] Update Member Failure',
  props<{ error: string }>()
);

// Filter Actions
export const setMembersFilters = createAction(
  '[Members] Set Filters',
  props<{ filters: Partial<MembersFilters> }>()
);
export const clearMembersFilters = createAction('[Members] Clear Filters');

// Online Status Actions
export const updateOnlineStatus = createAction('[Members] Update Online Status');
export const setMemberOnlineStatus = createAction(
  '[Members] Set Member Online Status',
  props<{ memberId: string; isOnline: boolean; lastSeen?: Date }>()
);
