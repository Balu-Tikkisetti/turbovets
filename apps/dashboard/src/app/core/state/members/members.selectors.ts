import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MembersState } from './members.reducer';
import { MemberWithStatus } from './members.actions';

export const selectMembersState = createFeatureSelector<MembersState>('members');

// Basic selectors
export const selectAllMembers = createSelector(
  selectMembersState,
  (state: MembersState) => state.members
);

export const selectFilteredMembers = createSelector(
  selectMembersState,
  (state: MembersState) => state.filteredMembers
);

export const selectMembersLoading = createSelector(
  selectMembersState,
  (state: MembersState) => state.loading
);

export const selectMembersError = createSelector(
  selectMembersState,
  (state: MembersState) => state.error
);

export const selectMembersFilters = createSelector(
  selectMembersState,
  (state: MembersState) => state.filters
);

export const selectLastUpdated = createSelector(
  selectMembersState,
  (state: MembersState) => state.lastUpdated
);

// Computed selectors
export const selectOnlineMembersCount = createSelector(
  selectAllMembers,
  (members: MemberWithStatus[]) => members.filter(member => member.isOnline).length
);

export const selectTotalMembersCount = createSelector(
  selectAllMembers,
  (members: MemberWithStatus[]) => members.length
);

export const selectMembersByRole = createSelector(
  selectAllMembers,
  (members: MemberWithStatus[]) => {
    return members.reduce((acc, member) => {
      const role = member.role;
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(member);
      return acc;
    }, {} as Record<string, MemberWithStatus[]>);
  }
);

export const selectMembersByDepartment = createSelector(
  selectAllMembers,
  (members: MemberWithStatus[]) => {
    return members.reduce((acc, member) => {
      const department = member.department || 'Unassigned';
      if (!acc[department]) {
        acc[department] = [];
      }
      acc[department].push(member);
      return acc;
    }, {} as Record<string, MemberWithStatus[]>);
  }
);

// Search selectors
export const selectMembersBySearchTerm = createSelector(
  selectAllMembers,
  (members: MemberWithStatus[], searchTerm: string) => {
    if (!searchTerm) return members;
    
    const term = searchTerm.toLowerCase();
    return members.filter(member => 
      member.username.toLowerCase().includes(term) ||
      (member.email && member.email.toLowerCase().includes(term))
    );
  }
);

// Combined selectors for performance
export const selectMembersWithFilters = createSelector(
  selectAllMembers,
  selectMembersFilters,
  (members: MemberWithStatus[], filters) => {
    return members.filter(member => {
      const matchesSearch = !filters.searchTerm || 
        member.username.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      
      const matchesRole = !filters.selectedRole || member.role === filters.selectedRole;
      
      const matchesDepartment = !filters.selectedDepartment || 
        member.department === filters.selectedDepartment;
      
      const matchesStatus = !filters.statusFilter || 
        (filters.statusFilter === 'online' && member.isOnline) ||
        (filters.statusFilter === 'offline' && !member.isOnline);
      
      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });
  }
);

// Cache selectors for expensive operations
export const selectMembersStats = createSelector(
  selectAllMembers,
  (members: MemberWithStatus[]) => {
    const stats = {
      total: members.length,
      online: 0,
      offline: 0,
      byRole: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>
    };
    
    members.forEach(member => {
      if (member.isOnline) {
        stats.online++;
      } else {
        stats.offline++;
      }
      
      // Count by role
      const role = member.role;
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;
      
      // Count by department
      const department = member.department || 'Unassigned';
      stats.byDepartment[department] = (stats.byDepartment[department] || 0) + 1;
    });
    
    return stats;
  }
);
