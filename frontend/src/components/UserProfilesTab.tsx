import React, { useState } from 'react';
import { useGetAllUserProfiles, useUpdateUserProfileRole, useApproveUser, useRejectUser } from '../hooks/useQueries';
import { UserRole, ApprovalStatus } from '../backend';
import type { UserProfile } from '../backend';
import type { Principal } from '@dfinity/principal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, User, Eye, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfilesTabProps {
  isAdmin: boolean;
}

export default function UserProfilesTab({ isAdmin }: UserProfilesTabProps) {
  const { data: userProfiles, isLoading } = useGetAllUserProfiles();
  const updateRole = useUpdateUserProfileRole();
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();

  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);
  const [approvingFor, setApprovingFor] = useState<string | null>(null);
  const [rejectingFor, setRejectingFor] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Hanya admin yang dapat mengakses halaman ini.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleRoleChange = async (principal: Principal, newRole: UserRole) => {
    const key = principal.toString();
    setUpdatingRoleFor(key);
    try {
      await updateRole.mutateAsync({ user: principal, newRole });
      toast.success('Peran pengguna berhasil diperbarui');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Gagal memperbarui peran: ' + message);
    } finally {
      setUpdatingRoleFor(null);
    }
  };

  const handleApprove = async (principal: Principal) => {
    const key = principal.toString();
    setApprovingFor(key);
    try {
      await approveUser.mutateAsync(principal);
      toast.success('Pengguna berhasil disetujui');
    } catch {
      // error handled in hook
    } finally {
      setApprovingFor(null);
    }
  };

  const handleReject = async (principal: Principal) => {
    const key = principal.toString();
    setRejectingFor(key);
    try {
      await rejectUser.mutateAsync(principal);
      toast.success('Pengguna berhasil ditolak');
    } catch {
      // error handled in hook
    } finally {
      setRejectingFor(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.admin:
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case UserRole.coordinator:
        return (
          <Badge className="bg-accent/20 text-accent border-accent/30 gap-1">
            <User className="h-3 w-3" />
            Koordinator
          </Badge>
        );
      case UserRole.viewer:
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Eye className="h-3 w-3" />
            Viewer
          </Badge>
        );
      default:
        return <Badge variant="outline">{String(role)}</Badge>;
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.approved:
        return (
          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 gap-1">
            <CheckCircle className="h-3 w-3" />
            Disetujui
          </Badge>
        );
      case ApprovalStatus.pending:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 gap-1">
            <Clock className="h-3 w-3" />
            Menunggu
          </Badge>
        );
      case ApprovalStatus.rejected:
        return (
          <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 gap-1">
            <XCircle className="h-3 w-3" />
            Ditolak
          </Badge>
        );
      default:
        return <Badge variant="outline">{String(status)}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Manajemen Pengguna</h2>
          <p className="text-sm text-muted-foreground">
            Kelola peran dan status persetujuan pengguna
          </p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          {userProfiles?.length ?? 0} pengguna
        </Badge>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Nama</TableHead>
              <TableHead className="font-semibold">Principal ID</TableHead>
              <TableHead className="font-semibold">Peran</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!userProfiles || userProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Belum ada pengguna terdaftar
                </TableCell>
              </TableRow>
            ) : (
              userProfiles.map(([principal, profile]: [Principal, UserProfile]) => {
                const key = principal.toString();
                const isUpdatingRole = updatingRoleFor === key;
                const isApproving = approvingFor === key;
                const isRejecting = rejectingFor === key;
                const isPending = profile.accountStatus === ApprovalStatus.pending;
                const isCoordinator = profile.role === UserRole.coordinator;

                return (
                  <TableRow key={key} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                      {key.slice(0, 16)}...
                    </TableCell>
                    <TableCell>
                      {profile.role === UserRole.admin ? (
                        getRoleBadge(profile.role)
                      ) : (
                        <Select
                          value={profile.role}
                          onValueChange={(value) => handleRoleChange(principal, value as UserRole)}
                          disabled={isUpdatingRole}
                        >
                          <SelectTrigger className="w-36 h-8 text-sm border-border">
                            {isUpdatingRole ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Memperbarui...</span>
                              </div>
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UserRole.coordinator}>Koordinator</SelectItem>
                            <SelectItem value={UserRole.viewer}>Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(profile.accountStatus)}</TableCell>
                    <TableCell>
                      {isPending && isCoordinator ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs border-green-500/50 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                            onClick={() => handleApprove(principal)}
                            disabled={isApproving || isRejecting}
                          >
                            {isApproving ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Setujui
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                            onClick={() => handleReject(principal)}
                            disabled={isApproving || isRejecting}
                          >
                            {isRejecting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Tolak
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
