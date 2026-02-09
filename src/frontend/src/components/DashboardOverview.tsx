import { useGetDashboardMetrics, useGetAllPrograms, useGetAllKPIs } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { Activity, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgramStatus, KpiStatus } from '../backend';
import { Progress } from '@/components/ui/progress';

export default function DashboardOverview() {
  const { data: metrics, isLoading: metricsLoading } = useGetDashboardMetrics();
  const { data: programs = [], isLoading: programsLoading } = useGetAllPrograms();
  const { data: kpis = [], isLoading: kpisLoading } = useGetAllKPIs();

  // Prepare chart data
  const programStatusData = [
    { name: 'Perencanaan', value: programs.filter(p => p.status === ProgramStatus.planning).length, fill: 'oklch(0.65 0.22 264)' },
    { name: 'Berjalan', value: programs.filter(p => p.status === ProgramStatus.ongoing).length, fill: 'oklch(0.60 0.20 160)' },
    { name: 'Selesai', value: programs.filter(p => p.status === ProgramStatus.completed).length, fill: 'oklch(0.70 0.18 120)' },
  ];

  const kpiStatusData = [
    { name: 'Belum Tercapai', value: kpis.filter(k => k.status === KpiStatus.notAchieved).length, fill: 'oklch(0.60 0.22 27)' },
    { name: 'Dalam Progress', value: kpis.filter(k => k.status === KpiStatus.inProgress).length, fill: 'oklch(0.62 0.22 280)' },
    { name: 'Tercapai', value: kpis.filter(k => k.status === KpiStatus.achieved).length, fill: 'oklch(0.60 0.20 160)' },
  ];

  // Program progress data - sorted by priority
  const programProgressData = programs
    .filter(p => p.status === ProgramStatus.ongoing)
    .sort((a, b) => {
      const priorityOrder = { high: 0, middle: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 6)
    .map(p => ({
      name: p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name,
      progress: Number(p.progress),
      fill: p.priority === 'high' ? 'oklch(0.65 0.22 264)' : p.priority === 'middle' ? 'oklch(0.62 0.22 280)' : 'oklch(0.60 0.20 160)',
    }));

  // Team KPI achievement data
  const teamKpiData = Array.from(
    kpis.reduce((acc, kpi) => {
      const teamName = kpi.team.name;
      if (!acc.has(teamName)) {
        acc.set(teamName, { achieved: 0, total: 0 });
      }
      const data = acc.get(teamName)!;
      data.total++;
      if (kpi.status === KpiStatus.achieved) {
        data.achieved++;
      }
      return acc;
    }, new Map<string, { achieved: number; total: number }>())
  )
    .map(([team, data]) => ({
      name: team.length > 18 ? team.substring(0, 18) + '...' : team,
      percentage: data.total > 0 ? Math.round((data.achieved / data.total) * 100) : 0,
      fill: 'oklch(0.62 0.22 280)',
    }))
    .slice(0, 6);

  if (metricsLoading || programsLoading || kpisLoading) {
    return (
      <div className="space-y-8 fade-in">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Program Aktif',
      value: metrics?.activePrograms || 0,
      description: 'Program yang sedang berjalan',
      icon: Activity,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Timeline Berjalan',
      value: metrics?.ongoingTimelines || 0,
      description: 'Timeline dalam progress',
      icon: TrendingUp,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'KPI Aktif',
      value: metrics?.activeKpis || 0,
      description: 'KPI yang sedang dipantau',
      icon: Target,
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'KPI Tercapai',
      value: `${metrics?.achievedKpisPercentage || 0}%`,
      description: 'Persentase pencapaian KPI',
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card 
              key={index} 
              className="border-0 shadow-lg card-hover fade-in overflow-hidden relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full -mr-16 -mt-16" 
                   style={{ background: `linear-gradient(135deg, oklch(var(--gradient-from)), oklch(var(--gradient-via)))` }} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold tracking-tight">{card.title}</CardTitle>
                <div className={`${card.iconBg} p-2.5 rounded-xl`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight mb-1">{card.value}</div>
                <p className="text-xs text-muted-foreground font-medium">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Program Progress Chart */}
        <Card className="border-0 shadow-lg card-hover fade-in" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold tracking-tight">Progress Program</CardTitle>
            <p className="text-sm text-muted-foreground font-medium">Berdasarkan prioritas (High → Middle → Low)</p>
          </CardHeader>
          <CardContent>
            {programProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={programProgressData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'oklch(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'oklch(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'oklch(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'oklch(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(var(--popover))',
                      border: '1px solid oklch(var(--border))',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      padding: '12px',
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                    formatter={(value: number) => [`${value}%`, 'Progress']}
                  />
                  <Bar dataKey="progress" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="progress" position="top" formatter={(value: number) => `${value}%`} style={{ fill: 'oklch(var(--foreground))', fontSize: 11, fontWeight: 600 }} />
                    {programProgressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground font-medium">
                Belum ada data program
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team KPI Achievement Chart */}
        <Card className="border-0 shadow-lg card-hover fade-in" style={{ animationDelay: '0.5s' }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold tracking-tight">Pencapaian KPI per Tim</CardTitle>
            <p className="text-sm text-muted-foreground font-medium">Persentase pencapaian target KPI</p>
          </CardHeader>
          <CardContent>
            {teamKpiData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={teamKpiData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'oklch(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'oklch(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'oklch(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'oklch(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(var(--popover))',
                      border: '1px solid oklch(var(--border))',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      padding: '12px',
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                    formatter={(value: number) => [`${value}%`, 'Pencapaian']}
                  />
                  <Bar dataKey="percentage" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="percentage" position="top" formatter={(value: number) => `${value}%`} style={{ fill: 'oklch(var(--foreground))', fontSize: 11, fontWeight: 600 }} />
                    {teamKpiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground font-medium">
                Belum ada data KPI
              </div>
            )}
          </CardContent>
        </Card>

        {/* Program Status Distribution */}
        <Card className="border-0 shadow-lg card-hover fade-in" style={{ animationDelay: '0.6s' }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold tracking-tight">Distribusi Status Program</CardTitle>
            <p className="text-sm text-muted-foreground font-medium">Ringkasan status semua program</p>
          </CardHeader>
          <CardContent>
            {programs.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={programStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      innerRadius={50}
                      fill="oklch(var(--chart-1))"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {programStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(var(--popover))',
                        border: '1px solid oklch(var(--border))',
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        padding: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {programStatusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground font-medium">
                Belum ada data program
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI Status Distribution */}
        <Card className="border-0 shadow-lg card-hover fade-in" style={{ animationDelay: '0.7s' }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold tracking-tight">Distribusi Status KPI</CardTitle>
            <p className="text-sm text-muted-foreground font-medium">Ringkasan status semua KPI</p>
          </CardHeader>
          <CardContent>
            {kpis.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={kpiStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      innerRadius={50}
                      fill="oklch(var(--chart-1))"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {kpiStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(var(--popover))',
                        border: '1px solid oklch(var(--border))',
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        padding: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {kpiStatusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground font-medium">
                Belum ada data KPI
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

