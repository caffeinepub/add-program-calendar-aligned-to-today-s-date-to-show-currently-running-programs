import { useState } from 'react';
import { useGetAllUserProfiles, useUpdateUserProfileRole, useIsCallerAdmin } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, Eye, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserRole } from '../backend';
import { Principal } from '@dfinity/principal';

export default function UserProfilesTab() {
  const { data: userProfiles = [], isLoading } = useGetAllUserProfiles();
  const { data: isAdmin = false, isLoading: isAdminLoading } = useIsCallerAdmin();
  const updateRoleMutation = useUpdateUserProfileRole();
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'coordinator': return 'Koordinator';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case 'admin': return 'default';
      case 'coordinator': return 'secondary';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'coordinator': return <Users className="h-4 w-4" />;
      case 'viewer': return <Eye className="h-4 w-4" />;
      default: return null;
    }
  };

  const handleRoleChange = async (userPrincipal: Principal, newRole: string) => {
    const principalString = userPrincipal.toString();
    setUpdatingUser(principalString);
    try {
      await updateRoleMutation.mutateAsync({
        user: userPrincipal,
        newRole: newRole as UserRole,
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Akses Ditolak</CardTitle>
          <CardDescription>Anda tidak memiliki izin untuk mengakses halaman ini</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Hanya administrator yang dapat mengelola profil pengguna dan peran.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Profil Pengguna</CardTitle>
        <CardDescription>
          Kelola peran pengguna dalam sistem. Hanya administrator yang dapat mengubah peran pengguna.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : userProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada profil pengguna terdaftar</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Principal ID</TableHead>
                  <TableHead>Peran Saat Ini</TableHead>
                  <TableHead className="text-right">Ubah Peran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userProfiles.map(([principal, profile]) => {
                  const principalString = principal.toString();
                  const isUpdating = updatingUser === principalString;
                  
                  return (
                    <TableRow key={principalString}>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {principalString.slice(0, 8)}...{principalString.slice(-6)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(profile.role)} className="gap-1">
                          {getRoleIcon(profile.role)}
                          {getRoleLabel(profile.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={profile.role}
                          onValueChange={(value) => handleRoleChange(principal, value)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="w-[180px] ml-auto">
                            {isUpdating ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Memperbarui...</span>
                              </div>
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Admin
                              </div>
                            </SelectItem>
                            <SelectItem value="coordinator">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Koordinator
                              </div>
                            </SelectItem>
                            <SelectItem value="viewer">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Viewer
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
