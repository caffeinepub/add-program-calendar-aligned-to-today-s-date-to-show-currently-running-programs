import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({ open, onComplete }: ProfileSetupModalProps) {
  const [name, setName] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const saveProfile = useSaveCallerUserProfile();
  const queryClient = useQueryClient();

  const isNameEmpty = !name.trim();

  const handleClose = () => {
    // Allow closing the modal at any time (even after error)
    onComplete();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (isNameEmpty) {
      setInlineError('Nama lengkap tidak boleh kosong');
      return;
    }

    if (name.trim().length < 2) {
      setInlineError('Nama harus minimal 2 karakter');
      return;
    }

    try {
      await saveProfile.mutateAsync(name.trim());

      // Invalidate and refetch the profile so App.tsx detects the new profile
      await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      await queryClient.refetchQueries({ queryKey: ['currentUserProfile'] });

      toast.success('Profil berhasil disimpan!');
      onComplete();
    } catch (error: unknown) {
      const raw = error instanceof Error ? error.message : String(error);

      // Provide user-friendly Indonesian error messages
      let friendlyMessage: string;
      if (raw.includes('Authentication required') || raw.includes('Unauthorized: Authentication')) {
        friendlyMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
      } else if (raw.includes('Only admins can assign user roles')) {
        // This should no longer happen after backend fix, but handle gracefully
        friendlyMessage = 'Terjadi kesalahan sistem. Silakan coba lagi atau hubungi administrator.';
      } else if (raw.includes('Actor not available')) {
        friendlyMessage = 'Koneksi ke server belum siap. Silakan tunggu sebentar dan coba lagi.';
      } else {
        friendlyMessage = 'Gagal menyimpan profil. Silakan coba lagi.';
      }

      setInlineError(friendlyMessage);
      // Do NOT show toast — inline error is sufficient and less alarming
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md border-0 shadow-2xl"
        style={{ background: 'var(--card)' }}
        onInteractOutside={(e) => e.preventDefault()}
        // Override the default close button with our own controlled one
        onEscapeKeyDown={handleClose}
      >
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-gradient-to-r from-primary via-accent to-secondary" />

        {/* Custom close button — always visible and functional */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-foreground"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader className="pt-4">
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Selamat Datang!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Silakan lengkapi profil Anda untuk melanjutkan
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-semibold">
              Nama Lengkap
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Masukkan nama lengkap Anda"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Clear inline error when user starts typing again
                if (inlineError) setInlineError(null);
              }}
              className="border-border focus:border-primary"
              disabled={saveProfile.isPending}
              autoFocus
            />
          </div>

          {/* Inline error message — always visible inside the modal */}
          {inlineError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{inlineError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full font-semibold bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 transition-opacity text-white border-0"
            disabled={saveProfile.isPending || isNameEmpty}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Profil'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
