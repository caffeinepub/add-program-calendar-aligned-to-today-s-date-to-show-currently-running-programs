import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, Shield, Fingerprint } from 'lucide-react';

export default function LoginPage() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const disabled = isLoggingIn;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center purple-blue-green-gradient p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-gradient-glow border-primary/30 bg-card/90 backdrop-blur-md relative z-10">
        {/* Top gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-gradient-to-r from-primary via-accent to-secondary" />

        <CardHeader className="space-y-6 text-center pt-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-purple-blue shadow-gradient-glow">
            <BarChart3 className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-full bg-clip-text text-transparent">
              SHQ KPI Tracker
            </CardTitle>
            <CardDescription className="text-base">
              Sistem Tracking Program & KPI
            </CardDescription>
            <p className="text-sm text-muted-foreground">
              Masuk untuk mengakses dashboard dan mengelola program serta KPI tim
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <Button
            onClick={handleAuth}
            disabled={disabled}
            className="w-full bg-gradient-blue-green hover:opacity-90 text-white shadow-gradient-glow font-semibold"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sedang Masuk...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-5 w-5" />
                Masuk dengan Internet Identity
              </>
            )}
          </Button>

          {/* Feature highlights */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span>Autentikasi aman dengan passkey, Google, Apple, atau Microsoft</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 flex-shrink-0">
                <Fingerprint className="h-4 w-4 text-accent" />
              </div>
              <span>Tidak perlu membuat akun baru — gunakan identitas yang sudah ada</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground border-t border-border/50 pt-4">
            Internet Identity adalah sistem autentikasi terdesentralisasi dari Internet Computer
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
