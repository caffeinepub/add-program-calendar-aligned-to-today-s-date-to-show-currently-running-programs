import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsCallerAdmin } from '../hooks/useQueries';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DashboardOverview from '../components/DashboardOverview';
import ProgramsTab from '../components/ProgramsTab';
import KPIsTab from '../components/KPIsTab';
import ReportsTab from '../components/ReportsTab';
import TeamMembersTab from '../components/TeamMembersTab';
import UserProfilesTab from '../components/UserProfilesTab';
import ProgramCalendarTab from '../components/ProgramCalendarTab';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: isAdmin = false } = useIsCallerAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-7' : 'grid-cols-6'} lg:w-auto lg:inline-grid bg-card/50 backdrop-blur-sm border shadow-lg p-1.5 rounded-xl`}>
              <TabsTrigger 
                value="dashboard" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground rounded-lg font-semibold transition-all duration-300"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="calendar"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground rounded-lg font-semibold transition-all duration-300"
              >
                Calendar
              </TabsTrigger>
              <TabsTrigger 
                value="programs"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground rounded-lg font-semibold transition-all duration-300"
              >
                Program
              </TabsTrigger>
              <TabsTrigger 
                value="kpis"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground rounded-lg font-semibold transition-all duration-300"
              >
                KPI
              </TabsTrigger>
              <TabsTrigger 
                value="team"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground rounded-lg font-semibold transition-all duration-300"
              >
                Tim
              </TabsTrigger>
              <TabsTrigger 
                value="reports"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground rounded-lg font-semibold transition-all duration-300"
              >
                Laporan
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger 
                  value="users"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground rounded-lg font-semibold transition-all duration-300"
                >
                  Pengguna
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8 slide-in">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-8 slide-in">
              <ProgramCalendarTab />
            </TabsContent>

            <TabsContent value="programs" className="space-y-8 slide-in">
              <ProgramsTab />
            </TabsContent>

            <TabsContent value="kpis" className="space-y-8 slide-in">
              <KPIsTab />
            </TabsContent>

            <TabsContent value="team" className="space-y-8 slide-in">
              <TeamMembersTab />
            </TabsContent>

            <TabsContent value="reports" className="space-y-8 slide-in">
              <ReportsTab />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="users" className="space-y-8 slide-in">
                <UserProfilesTab />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
