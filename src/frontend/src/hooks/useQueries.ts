import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Program, Kpi, UserProfile, TeamMemberWithAvatar, ProgramStatus, KpiStatus, KpiPeriod, PersonInCharge, UserRole, TimeRange, TeamAgendaItem } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import { ExternalBlob } from '../backend';

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

// Get unique PIC names for KPI filtering
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

export function useCreateProgram() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (program: Omit<Program, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createProgram(program as Program);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programsActiveInRange'] });
      queryClient.invalidateQueries({ queryKey: ['programsActiveOnDate'] });
      toast.success('Program berhasil ditambahkan');
    },
    onError: (error: Error) => {
      console.error('Create program error:', error);
      toast.error('Gagal menambahkan program: ' + error.message);
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
      toast.success('Program berhasil diperbarui');
    },
    onError: (error: Error) => {
      console.error('Update program error:', error);
      toast.error('Gagal memperbarui program: ' + error.message);
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
      toast.success('Program berhasil dihapus');
    },
    onError: (error: Error) => {
      console.error('Delete program error:', error);
      toast.error('Gagal menghapus program: ' + error.message);
    },
  });
}

export function useCreateKpi() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kpi: Omit<Kpi, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      
      // Log the payload being sent
      console.log('Creating KPI with payload:', {
        name: kpi.name,
        relatedProgramId: kpi.relatedProgramId.toString(),
        team: {
          id: kpi.team.id.toString(),
          name: kpi.team.name,
          division: kpi.team.division,
          role: kpi.team.role,
        },
        targetValue: kpi.targetValue.toString(),
        realizationValue: kpi.realizationValue.toString(),
        period: kpi.period,
        status: kpi.status,
        deadline: kpi.deadline ? kpi.deadline.toString() : null,
      });

      try {
        const result = await actor.createKpi(kpi as Kpi);
        console.log('KPI created successfully with ID:', result.toString());
        return result;
      } catch (error: any) {
        console.error('Backend error creating KPI:', {
          error,
          message: error.message,
          stack: error.stack,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['kpisWithDeadlines'] });
      queryClient.invalidateQueries({ queryKey: ['uniquePICNames'] });
      toast.success('KPI berhasil ditambahkan');
    },
    onError: (error: Error) => {
      console.error('Create KPI mutation error:', error);
      
      // Extract more specific error information
      const errorMessage = error.message || 'Unknown error';
      
      // Check for specific validation errors
      if (errorMessage.includes('name')) {
        toast.error('Error pada field Nama KPI: ' + errorMessage);
      } else if (errorMessage.includes('team') || errorMessage.includes('PIC')) {
        toast.error('Error pada field Tim/PIC: ' + errorMessage);
      } else if (errorMessage.includes('target')) {
        toast.error('Error pada field Nilai Target: ' + errorMessage);
      } else if (errorMessage.includes('realization')) {
        toast.error('Error pada field Nilai Realisasi: ' + errorMessage);
      } else if (errorMessage.includes('program')) {
        toast.error('Error pada field Program Terkait: ' + errorMessage);
      } else if (errorMessage.includes('invalid record')) {
        toast.error('Data KPI tidak valid. Periksa semua field dan coba lagi.');
      } else {
        toast.error('Gagal menambahkan KPI: ' + errorMessage);
      }
    },
  });
}

export function useUpdateKpi() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, kpi }: { id: bigint; kpi: Kpi }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Log the payload being sent
      console.log('Updating KPI with payload:', {
        id: id.toString(),
        name: kpi.name,
        relatedProgramId: kpi.relatedProgramId.toString(),
        team: {
          id: kpi.team.id.toString(),
          name: kpi.team.name,
          division: kpi.team.division,
          role: kpi.team.role,
        },
        targetValue: kpi.targetValue.toString(),
        realizationValue: kpi.realizationValue.toString(),
        period: kpi.period,
        status: kpi.status,
        deadline: kpi.deadline ? kpi.deadline.toString() : null,
      });

      try {
        await actor.updateKpiAndSyncProgram(id, kpi);
        console.log('KPI updated successfully');
      } catch (error: any) {
        console.error('Backend error updating KPI:', {
          error,
          message: error.message,
          stack: error.stack,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['kpisWithDeadlines'] });
      queryClient.invalidateQueries({ queryKey: ['uniquePICNames'] });
      toast.success('KPI berhasil diperbarui');
    },
    onError: (error: Error) => {
      console.error('Update KPI mutation error:', error);
      
      // Extract more specific error information
      const errorMessage = error.message || 'Unknown error';
      
      // Check for specific validation errors
      if (errorMessage.includes('name')) {
        toast.error('Error pada field Nama KPI: ' + errorMessage);
      } else if (errorMessage.includes('team') || errorMessage.includes('PIC')) {
        toast.error('Error pada field Tim/PIC: ' + errorMessage);
      } else if (errorMessage.includes('target')) {
        toast.error('Error pada field Nilai Target: ' + errorMessage);
      } else if (errorMessage.includes('realization')) {
        toast.error('Error pada field Nilai Realisasi: ' + errorMessage);
      } else if (errorMessage.includes('program')) {
        toast.error('Error pada field Program Terkait: ' + errorMessage);
      } else if (errorMessage.includes('invalid record')) {
        toast.error('Data KPI tidak valid. Periksa semua field dan coba lagi.');
      } else {
        toast.error('Gagal memperbarui KPI: ' + errorMessage);
      }
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
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['kpisWithDeadlines'] });
      queryClient.invalidateQueries({ queryKey: ['uniquePICNames'] });
      toast.success('KPI berhasil dihapus');
    },
    onError: (error: Error) => {
      console.error('Delete KPI error:', error);
      toast.error('Gagal menghapus KPI: ' + error.message);
    },
  });
}

// Team Member Queries
export function useGetAllTeamMembers() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamMemberWithAvatar[]>({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeamMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

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

// Get team members by division for program form
export function useGetTeamMembersByDivision(division: string) {
  const { actor, isFetching } = useActor();

  return useQuery<TeamMemberWithAvatar[]>({
    queryKey: ['teamMembersByDivision', division],
    queryFn: async () => {
      if (!actor || !division) return [];
      return actor.getTeamMembersByDivision(division);
    },
    enabled: !!actor && !isFetching && !!division,
  });
}

export function useCreateTeamMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: { id: bigint; name: string; division: string; role: string; managerId?: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeamMember(member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['uniqueDivisions'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembersByDivision'] });
      toast.success('Anggota tim berhasil ditambahkan');
    },
    onError: (error: Error) => {
      console.error('Create team member error:', error);
      toast.error('Gagal menambahkan anggota tim: ' + error.message);
    },
  });
}

export function useUpdateTeamMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, member }: { id: bigint; member: { id: bigint; name: string; division: string; role: string; managerId?: bigint } }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTeamMember(id, member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['uniqueDivisions'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembersByDivision'] });
      toast.success('Anggota tim berhasil diperbarui');
    },
    onError: (error: Error) => {
      console.error('Update team member error:', error);
      toast.error('Gagal memperbarui anggota tim: ' + error.message);
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
      queryClient.invalidateQueries({ queryKey: ['uniqueDivisions'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembersByDivision'] });
      toast.success('Anggota tim berhasil dihapus');
    },
    onError: (error: Error) => {
      console.error('Delete team member error:', error);
      toast.error('Gagal menghapus anggota tim: ' + error.message);
    },
  });
}

// Team Member Avatar
export function useSetTeamMemberAvatar() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, avatar }: { memberId: bigint; avatar: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setTeamMemberAvatar(memberId, avatar);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembersByDivision'] });
      toast.success('Foto berhasil diperbarui');
    },
    onError: (error: Error) => {
      console.error('Set team member avatar error:', error);
      toast.error('Gagal memperbarui foto: ' + error.message);
    },
  });
}

// Team Agenda Mutations
export function useCreateTeamAgendaItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<TeamAgendaItem, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeamAgendaItem(item as TeamAgendaItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamAgendaItems'] });
      queryClient.invalidateQueries({ queryKey: ['teamAgendaItemsByRange'] });
      toast.success('Agenda berhasil ditambahkan');
    },
    onError: (error: Error) => {
      console.error('Create team agenda item error:', error);
      toast.error('Gagal menambahkan agenda: ' + error.message);
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
      toast.success('Agenda berhasil diperbarui');
    },
    onError: (error: Error) => {
      console.error('Update team agenda item error:', error);
      toast.error('Gagal memperbarui agenda: ' + error.message);
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
      toast.success('Agenda berhasil dihapus');
    },
    onError: (error: Error) => {
      console.error('Delete team agenda item error:', error);
      toast.error('Gagal menghapus agenda: ' + error.message);
    },
  });
}
