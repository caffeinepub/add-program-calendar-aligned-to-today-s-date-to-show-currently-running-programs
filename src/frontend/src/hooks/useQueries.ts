import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Program, Kpi, UserProfile, TeamMember, ProgramStatus, KpiStatus, KpiPeriod, PersonInCharge, UserRole, TimeRange } from '../backend';
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
      toast.success('Profil berhasil disimpan');
    },
    onError: (error: Error) => {
      toast.error('Gagal menyimpan profil: ' + error.message);
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
      toast.success('Peran pengguna berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error('Gagal memperbarui peran pengguna: ' + error.message);
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

export function useCreateProgram() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProgram: Omit<Program, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createProgram({ ...newProgram, id: BigInt(0) } as Program);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programsActiveOnDate'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      toast.success('Program berhasil dibuat');
    },
    onError: (error: Error) => {
      toast.error('Gagal membuat program: ' + error.message);
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
      queryClient.invalidateQueries({ queryKey: ['programsActiveOnDate'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      toast.success('Program berhasil diperbarui');
    },
    onError: (error: Error) => {
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
      queryClient.invalidateQueries({ queryKey: ['programsActiveOnDate'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      toast.success('Program berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error('Gagal menghapus program: ' + error.message);
    },
  });
}

// KPI Queries
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

export function useCreateKpi() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newKpi: Omit<Kpi, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createKpi({ ...newKpi, id: BigInt(0) } as Kpi);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      toast.success('KPI berhasil dibuat');
    },
    onError: (error: Error) => {
      toast.error('Gagal membuat KPI: ' + error.message);
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
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      toast.success('KPI berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error('Gagal memperbarui KPI: ' + error.message);
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
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      toast.success('KPI berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error('Gagal menghapus KPI: ' + error.message);
    },
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

export function useGetTeamMembersByDivision(division: string) {
  const { actor, isFetching } = useActor();

  return useQuery<TeamMember[]>({
    queryKey: ['teamMembersByDivision', division],
    queryFn: async () => {
      if (!actor) return [];
      if (!division) return [];
      return actor.getTeamMembersByDivisionFiltered(division);
    },
    enabled: !!actor && !isFetching && !!division,
  });
}

export function useCreateTeamMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newMember: Omit<TeamMember, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeamMember({ ...newMember, id: BigInt(0) } as TeamMember);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['uniqueDivisions'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembersByDivision'] });
      toast.success('Anggota tim berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error('Gagal menambahkan anggota tim: ' + error.message);
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
      queryClient.invalidateQueries({ queryKey: ['uniqueDivisions'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembersByDivision'] });
      toast.success('Anggota tim berhasil diperbarui');
    },
    onError: (error: Error) => {
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
      toast.error('Gagal menghapus anggota tim: ' + error.message);
    },
  });
}

// Dashboard Metrics
export function useGetDashboardMetrics() {
  const { data: programs = [], isLoading: programsLoading } = useGetAllPrograms();
  const { data: kpis = [], isLoading: kpisLoading } = useGetAllKPIs();

  const metrics = {
    activePrograms: programs.filter(p => p.status === 'ongoing').length,
    ongoingTimelines: programs.filter(p => p.status === 'ongoing').length,
    activeKpis: kpis.filter(k => k.status === 'inProgress' || k.status === 'notAchieved').length,
    achievedKpisPercentage: kpis.length > 0 
      ? Math.round((kpis.filter(k => k.status === 'achieved').length / kpis.length) * 100)
      : 0,
  };

  return {
    data: metrics,
    isLoading: programsLoading || kpisLoading,
  };
}
