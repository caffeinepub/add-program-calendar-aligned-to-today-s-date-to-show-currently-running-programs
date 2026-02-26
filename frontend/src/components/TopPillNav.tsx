import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TopPillNavProps {
  isAdmin: boolean;
}

export default function TopPillNav({ isAdmin }: TopPillNavProps) {
  return (
    <div className="flex justify-center w-full py-4">
      <TabsList className="pill-nav-container inline-flex h-auto p-1.5 gap-1">
        <TabsTrigger 
          value="dashboard" 
          className="data-[state=active]:bg-gradient-purple-blue data-[state=active]:text-white rounded-full px-4 py-2 font-medium transition-all duration-300 hover:bg-white/10 text-white/80"
        >
          Dashboard
        </TabsTrigger>
        <TabsTrigger 
          value="calendar"
          className="data-[state=active]:bg-gradient-purple-blue data-[state=active]:text-white rounded-full px-4 py-2 font-medium transition-all duration-300 hover:bg-white/10 text-white/80"
        >
          Calendar
        </TabsTrigger>
        <TabsTrigger 
          value="programs"
          className="data-[state=active]:bg-gradient-purple-blue data-[state=active]:text-white rounded-full px-4 py-2 font-medium transition-all duration-300 hover:bg-white/10 text-white/80"
        >
          Program
        </TabsTrigger>
        <TabsTrigger 
          value="kpis"
          className="data-[state=active]:bg-gradient-purple-blue data-[state=active]:text-white rounded-full px-4 py-2 font-medium transition-all duration-300 hover:bg-white/10 text-white/80"
        >
          KPI
        </TabsTrigger>
        <TabsTrigger 
          value="team"
          className="data-[state=active]:bg-gradient-purple-blue data-[state=active]:text-white rounded-full px-4 py-2 font-medium transition-all duration-300 hover:bg-white/10 text-white/80"
        >
          Team
        </TabsTrigger>
        <TabsTrigger 
          value="reports"
          className="data-[state=active]:bg-gradient-purple-blue data-[state=active]:text-white rounded-full px-4 py-2 font-medium transition-all duration-300 hover:bg-white/10 text-white/80"
        >
          Laporan
        </TabsTrigger>
        {isAdmin && (
          <TabsTrigger 
            value="users"
            className="data-[state=active]:bg-gradient-purple-blue data-[state=active]:text-white rounded-full px-4 py-2 font-medium transition-all duration-300 hover:bg-white/10 text-white/80"
          >
            Pengguna
          </TabsTrigger>
        )}
      </TabsList>
    </div>
  );
}
