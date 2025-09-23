import { createReducer, on } from '@ngrx/store';
import { 
  loadMembers, 
  loadMembersSuccess, 
  loadMembersFailure,
  updateMember,
  updateMemberSuccess,
  updateMemberFailure,
  setMembersFilters,
  clearMembersFilters,
  updateOnlineStatus,
  setMemberOnlineStatus,
  MemberWithStatus,
  MembersFilters
} from './members.actions';

export interface MembersState {
  members: MemberWithStatus[];
  filteredMembers: MemberWithStatus[];
  filters: MembersFilters;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export const initialState: MembersState = {
  members: [],
  filteredMembers: [],
  filters: {
    searchTerm: '',
    selectedRole: '',
    selectedDepartment: '',
    statusFilter: ''
  },
  loading: false,
  error: null,
  lastUpdated: null
};

export const membersReducer = createReducer(
  initialState,
  
  // Load Members
  on(loadMembers, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(loadMembersSuccess, (state, { members }) => ({
    ...state,
    members,
    filteredMembers: members, // Initially show all members
    loading: false,
    error: null,
    lastUpdated: Date.now()
  })),
  
  on(loadMembersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update Member
  on(updateMember, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(updateMemberSuccess, (state, { member }) => {
    const updatedMembers = state.members.map(m => 
      m.id === member.id ? member : m
    );
    
    return {
      ...state,
      members: updatedMembers,
      loading: false,
      error: null
    };
  }),
  
  on(updateMemberFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Filters
  on(setMembersFilters, (state, { filters }) => {
    const newFilters = { ...state.filters, ...filters };
    const filteredMembers = applyFilters(state.members, newFilters);
    
    return {
      ...state,
      filters: newFilters,
      filteredMembers
    };
  }),
  
  on(clearMembersFilters, (state) => ({
    ...state,
    filters: {
      searchTerm: '',
      selectedRole: '',
      selectedDepartment: '',
      statusFilter: ''
    },
    filteredMembers: state.members
  })),
  
  // Online Status
  on(updateOnlineStatus, (state) => ({
    ...state,
    members: state.members.map(member => ({
      ...member,
      isOnline: determineOnlineStatus(member)
    }))
  })),
  
  on(setMemberOnlineStatus, (state, { memberId, isOnline, lastSeen }) => ({
    ...state,
    members: state.members.map(member => 
      member.id === memberId 
        ? { ...member, isOnline, lastSeen }
        : member
    )
  }))
);

// Helper functions
function applyFilters(members: MemberWithStatus[], filters: MembersFilters): MemberWithStatus[] {
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

function determineOnlineStatus(user: MemberWithStatus): boolean {
  if (!user.lastLoginAt) return false;
  const lastLogin = new Date(user.lastLoginAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastLogin.getTime()) / (1000 * 60);
  return diffMinutes <= 5;
}
