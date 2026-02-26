import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import LoginPage from './pages/LoginPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import Dashboard from './pages/Dashboard';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  // Show loading state while initializing identity
  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="flex h-screen items-center justify-center purple-blue-green-gradient-dark">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Memuat aplikasi...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <LoginPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show loading while fetching profile for the first time
  // Use isFetched from our custom hook which accounts for actor dependency
  if (profileLoading || !isFetched) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="flex h-screen items-center justify-center purple-blue-green-gradient-dark">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Memuat profil...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show profile setup modal if authenticated but no profile yet
  // isFetched ensures we don't flash the modal before the query completes
  const showProfileSetup = isAuthenticated && isFetched && userProfile === null;

  const handleProfileComplete = async () => {
    // Refetch profile after setup so the modal closes and dashboard shows
    await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    await queryClient.refetchQueries({ queryKey: ['currentUserProfile'] });
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen purple-blue-green-gradient-dark">
        {showProfileSetup ? (
          <ProfileSetupModal
            open={showProfileSetup}
            onComplete={handleProfileComplete}
          />
        ) : (
          <Dashboard />
        )}
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
