import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Sistem Tracking KPI</CardTitle>
            <CardDescription className="mt-2">
              Aplikasi pelacakan timeline program dan KPI tim untuk yayasan dan organisasi
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Masuk...
              </>
            ) : (
              'Masuk dengan Internet Identity'
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Masuk untuk mengakses dashboard dan mengelola program serta KPI
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
