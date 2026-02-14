import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Program, Kpi, UserProfile, TeamMember, ProgramStatus, KpiStatus, KpiPeriod, PersonInCharge, UserRole, TimeRange, TeamAgendaItem } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to save profile: ' + error.message);
    },
  });
}

// Admin: Get all user profiles
export function useGetAllUserProfiles() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['allUserProfiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

// Admin: Update user profile role
export function useUpdateUserProfileRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, newRole }: { user: Principal; newRole: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUserProfileRole(user, newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserProfiles'] });
      toast.success('User role updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update user role: ' + error.message);
    },
  });
}

// Check if caller is admin
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Program Queries
export function useGetAllPrograms() {
  const { actor, isFetching } = useActor();

  return useQuery<Program[]>({
    queryKey: ['programs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPrograms();
    },
    enabled: !!actor && !isFetching,
  });
}

// Get programs active on a specific date
export function useGetProgramsActiveOnDate(date: Date) {
  const { actor, isFetching } = useActor();

  return useQuery<Program[]>({
    queryKey: ['programsActiveOnDate', date.toISOString()],
    queryFn: async () => {
      if (!actor) return [];
      
      // Convert the selected date to start and end of day in milliseconds
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const timeRange: TimeRange = {
        start: BigInt(startOfDay.getTime()),
        end: BigInt(endOfDay.getTime()),
      };
      
      return actor.getProgramsActiveInRange(timeRange);
    },
    enabled: !!actor && !isFetching,
  });
}

// Get programs active in a date range (for calendar views)
export function useGetProgramsActiveInRange(range: TimeRange) {
  const { actor, isFetching } = useActor();

  return useQuery<Program[]>({
    queryKey: ['programsActiveInRange', range.start.toString(), range.end.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProgramsActiveInRange(range);
    },
    enabled: !!actor && !isFetching,
  });
}

// Team Agenda Queries
export function useGetTeamAgendaItemsByRange(range: TimeRange) {
  const { actor, isFetching } = useActor();

  return useQuery<TeamAgendaItem[]>({
    queryKey: ['teamAgendaItemsByRange', range.start.toString(), range.end.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTeamAgendaItemsByRange(range);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllTeamAgendaItems() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamAgendaItem[]>({
    queryKey: ['teamAgendaItems'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeamAgendaItems();
    },
    enabled: !!actor && !isFetching,
  });
}

// KPI Queries with deadline filtering
export function useGetKPIsWithDeadlinesInRange(range: TimeRange) {
  const { actor, isFetching } = useActor();

  return useQuery<Kpi[]>({
    queryKey: ['kpisWithDeadlines', range.start.toString(), range.end.toString()],
    queryFn: async () => {
      if (!actor) return [];
      const allKpis = await actor.getAllKPIs();
      // Filter KPIs that have deadlines within the range
      return allKpis.filter(kpi => {
        if (!kpi.deadline) return false;
        return kpi.deadline >= range.start && kpi.deadline <= range.end;
      });
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllKPIs() {
  const { actor, isFetching } = useActor();

  return useQuery<Kpi[]>({
    queryKey: ['kpis'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllKPIs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUniquePICNames() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['uniquePICNames'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUniquePICNames();
    },
    enabled: !!actor && !isFetching,
  });
}

// Get unique divisions from team members
export function useGetUniqueDivisions() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['uniqueDivisions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUniqueDivisions();
    },
    enabled: !!actor && !isFetching,
  });
}

// Team Member Queries
export function useGetAllTeamMembers() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamMember[]>({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeamMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTeamMembersByDivision(division: string) {
  const { actor, isFetching } = useActor();

  return useQuery<TeamMember[]>({
    queryKey: ['teamMembersByDivision', division],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTeamMembersByDivision(division);
    },
    enabled: !!actor && !isFetching && !!division,
  });
}

// Program Mutations
export function useCreateProgram() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (program: Program) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createProgram(program);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programsActiveInRange'] });
      queryClient.invalidateQueries({ queryKey: ['programsActiveOnDate'] });
      toast.success('Program created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create program: ' + error.message);
    },
  });
}

export function useUpdateProgram() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, program }: { id: bigint; program: Program }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProgram(id, program);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programsActiveInRange'] });
      queryClient.invalidateQueries({ queryKey: ['programsActiveOnDate'] });
      toast.success('Program updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update program: ' + error.message);
    },
  });
}

export function useDeleteProgram() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteProgram(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programsActiveInRange'] });
      queryClient.invalidateQueries({ queryKey: ['programsActiveOnDate'] });
      toast.success('Program deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete program: ' + error.message);
    },
  });
}

// KPI Mutations
export function useCreateKpi() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kpi: Kpi) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createKpi(kpi);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpisWithDeadlines'] });
      toast.success('KPI created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create KPI: ' + error.message);
    },
  });
}

export function useUpdateKpi() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, kpi }: { id: bigint; kpi: Kpi }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateKpi(id, kpi);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpisWithDeadlines'] });
      toast.success('KPI updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update KPI: ' + error.message);
    },
  });
}

export function useDeleteKpi() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteKpi(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpisWithDeadlines'] });
      toast.success('KPI deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete KPI: ' + error.message);
    },
  });
}

// Team Member Mutations
export function useCreateTeamMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: TeamMember) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeamMember(member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembersByDivision'] });
      queryClient.invalidateQueries({ queryKey: ['uniqueDivisions'] });
      toast.success('Team member created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create team member: ' + error.message);
    },
  });
}

export function useUpdateTeamMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, member }: { id: bigint; member: TeamMember }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTeamMember(id, member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembersByDivision'] });
      queryClient.invalidateQueries({ queryKey: ['uniqueDivisions'] });
      toast.success('Team member updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update team member: ' + error.message);
    },
  });
}

export function useDeleteTeamMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTeamMember(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembersByDivision'] });
      queryClient.invalidateQueries({ queryKey: ['uniqueDivisions'] });
      toast.success('Team member deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete team member: ' + error.message);
    },
  });
}

// Team Agenda Mutations
export function useCreateTeamAgendaItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: TeamAgendaItem) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeamAgendaItem(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamAgendaItems'] });
      queryClient.invalidateQueries({ queryKey: ['teamAgendaItemsByRange'] });
      toast.success('Agenda item created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create agenda item: ' + error.message);
    },
  });
}

export function useUpdateTeamAgendaItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, item }: { id: bigint; item: TeamAgendaItem }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTeamAgendaItem(id, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamAgendaItems'] });
      queryClient.invalidateQueries({ queryKey: ['teamAgendaItemsByRange'] });
      toast.success('Agenda item updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update agenda item: ' + error.message);
    },
  });
}

export function useDeleteTeamAgendaItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTeamAgendaItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamAgendaItems'] });
      queryClient.invalidateQueries({ queryKey: ['teamAgendaItemsByRange'] });
      toast.success('Agenda item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete agenda item: ' + error.message);
    },
  });
}
