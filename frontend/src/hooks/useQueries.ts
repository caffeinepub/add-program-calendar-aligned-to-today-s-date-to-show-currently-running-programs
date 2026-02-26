import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Program, Kpi, TeamAgendaItem, UserProfile, TeamMemberCreateRequest, TimeRange, TeamMemberWithAvatar } from '../backend';
import { UserRole, ApprovalStatus } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import type { Principal } from '@dfinity/principal';

// ─── User Profile (with actor-dependency guard to prevent modal flash) ────────

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

  // Return custom state that properly reflects actor dependency
  // This prevents the profile setup modal from flashing before the actor is ready
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !actorFetching && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

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

export function useGetAllUserProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery<[Principal, UserProfile][]>({
    queryKey: ['userProfiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateUserProfileRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, newRole }: { user: Principal; newRole: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUserProfileRole(user, newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
    },
  });
}

export function useApproveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveUser(userPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Gagal menyetujui pengguna: ' + message);
    },
  });
}

export function useRejectUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectUser(userPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Gagal menolak pengguna: ' + message);
    },
  });
}

// ─── Programs ────────────────────────────────────────────────────────────────

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

// Get programs active in a date range (client-side filtering)
export function useGetProgramsActiveInRange(range: TimeRange) {
  const { actor, isFetching } = useActor();
  return useQuery<Program[]>({
    queryKey: ['programsActiveInRange', range.start.toString(), range.end.toString()],
    queryFn: async () => {
      if (!actor) return [];
      const allPrograms = await actor.getAllPrograms();
      return allPrograms.filter(
        (program) => program.startDate <= range.end && program.endDate >= range.start
      );
    },
    enabled: !!actor && !isFetching,
  });
}

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
    },
  });
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

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

// KPI Queries with deadline filtering (client-side)
export function useGetKPIsWithDeadlinesInRange(range: TimeRange) {
  const { actor, isFetching } = useActor();
  return useQuery<Kpi[]>({
    queryKey: ['kpisWithDeadlines', range.start.toString(), range.end.toString()],
    queryFn: async () => {
      if (!actor) return [];
      const allKpis = await actor.getAllKPIs();
      return allKpis.filter((kpi) => {
        if (!kpi.deadline) return false;
        return kpi.deadline >= range.start && kpi.deadline <= range.end;
      });
    },
    enabled: !!actor && !isFetching,
  });
}

// Get unique PIC names for KPI filtering (client-side)
export function useGetUniquePICNames() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ['uniquePICNames'],
    queryFn: async () => {
      if (!actor) return [];
      const allKpis = await actor.getAllKPIs();
      const uniqueNames = new Set<string>();
      allKpis.forEach((kpi) => {
        if (kpi.team.name) uniqueNames.add(kpi.team.name);
      });
      return Array.from(uniqueNames).sort();
    },
    enabled: !!actor && !isFetching,
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['kpisWithDeadlines'] });
      queryClient.invalidateQueries({ queryKey: ['uniquePICNames'] });
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
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['kpisWithDeadlines'] });
      queryClient.invalidateQueries({ queryKey: ['uniquePICNames'] });
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
    },
  });
}

// ─── Team Members ─────────────────────────────────────────────────────────────

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

// Get unique divisions (client-side)
export function useGetUniqueDivisions() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ['uniqueDivisions'],
    queryFn: async () => {
      if (!actor) return [];
      const allMembers = await actor.getAllTeamMembers();
      const uniqueDivisions = new Set<string>();
      allMembers.forEach((member) => {
        if (member.division) uniqueDivisions.add(member.division);
      });
      return Array.from(uniqueDivisions).sort();
    },
    enabled: !!actor && !isFetching,
  });
}

// Get team members by division for program form (client-side filtering)
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
    mutationFn: async (member: TeamMemberCreateRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeamMember(member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['uniqueDivisions'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembersByDivision'] });
      toast.success('Anggota tim berhasil ditambahkan');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Gagal menambahkan anggota tim: ' + message);
    },
  });
}

export function useUpdateTeamMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, member }: { id: bigint; member: TeamMemberCreateRequest }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTeamMember(id, member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['uniqueDivisions'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembersByDivision'] });
      toast.success('Anggota tim berhasil diperbarui');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Gagal memperbarui anggota tim: ' + message);
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
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Gagal menghapus anggota tim: ' + message);
    },
  });
}

export function useSetTeamMemberAvatar() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, avatar }: { memberId: bigint; avatar: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setTeamMemberAvatar(memberId, avatar);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['teamMemberAvatar', variables.memberId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Team member not found')) {
        toast.error('Anggota tim tidak ditemukan');
      } else if (message.includes('Unauthorized')) {
        toast.error('Anda tidak memiliki izin untuk mengubah foto');
      } else {
        toast.error('Gagal mengunggah foto: ' + message);
      }
    },
  });
}

// ─── Team Agenda ──────────────────────────────────────────────────────────────

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
    },
  });
}
