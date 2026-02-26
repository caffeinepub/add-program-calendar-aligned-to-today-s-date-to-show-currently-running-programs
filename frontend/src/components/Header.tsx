import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { Moon, Sun, LogOut, User } from 'lucide-react';
import { getUserDisplayName, getUserInitials } from '../utils/userDisplayName';

export default function Header() {
  const { clear, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const principalText = identity ? identity.getPrincipal().toText() : null;
  const displayName = getUserDisplayName(userProfile, principalText);
  const userInitials = getUserInitials(userProfile, principalText);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-gradient-purple-blue/80 backdrop-blur-lg shadow-gradient-glow">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
            <img src="/assets/Satu-Dekade-SHQ-Logo_Alt.png" alt="SHQ Logo" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">SHQ KPI Tracker</h1>
            <p className="text-xs text-white/70">Sistem Tracking Program & KPI</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-white hover:bg-white/10"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10">
                <Avatar className="h-10 w-10 border-2 border-white/20">
                  <AvatarFallback className="bg-gradient-blue-green text-white font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-md border-primary/20">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userProfile?.role || 'viewer'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
