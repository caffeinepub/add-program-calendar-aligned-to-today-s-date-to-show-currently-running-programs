import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useIsCallerAdmin } from '../hooks/useQueries';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TopPillNav from '../components/TopPillNav';
import DashboardOverview from '../components/DashboardOverview';
import ProgramsTab from '../components/ProgramsTab';
import KPIsTab from '../components/KPIsTab';
import ReportsTab from '../components/ReportsTab';
import TeamMembersTab from '../components/TeamMembersTab';
import UserProfilesTab from '../components/UserProfilesTab';
import ProgramCalendarTabBoundary from '../components/ProgramCalendarTabBoundary';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: isAdmin = false } = useIsCallerAdmin();

  return (
    <div className="flex min-h-screen flex-col navy-gradient-bg">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TopPillNav isAdmin={isAdmin} />

            <TabsContent value="dashboard" className="space-y-8 slide-in">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-8 slide-in">
              <ProgramCalendarTabBoundary />
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
