import { Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const appIdentifier = typeof window !== 'undefined' 
    ? encodeURIComponent(window.location.hostname) 
    : 'shq-kpi-tracker';

  return (
    <footer className="mt-auto border-t border-primary/20 bg-gradient-blue-green/80 backdrop-blur-lg py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-white/90">
            © {currentYear} SHQ KPI Tracker. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-white/70">
            Built with <Heart className="h-3 w-3 fill-accent text-accent" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white hover:text-accent transition-colors underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
