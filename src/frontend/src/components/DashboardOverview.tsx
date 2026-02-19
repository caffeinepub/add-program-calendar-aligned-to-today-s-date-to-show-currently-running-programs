import { useMemo } from 'react';
import { useGetAllPrograms, useGetAllKPIs } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TrendingUp, Target, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { ProgramStatus, KpiStatus } from '../backend';

export default function DashboardOverview() {
  const { data: programs = [], isLoading: programsLoading } = useGetAllPrograms();
  const { data: kpis = [], isLoading: kpisLoading } = useGetAllKPIs();

  const metrics = useMemo(() => {
    const totalPrograms = programs.length;
    const ongoingPrograms = programs.filter(p => p.status === ProgramStatus.ongoing).length;
    const completedPrograms = programs.filter(p => p.status === ProgramStatus.completed).length;
    
    const totalKpis = kpis.length;
    const achievedKpis = kpis.filter(k => k.status === KpiStatus.achieved).length;
    const inProgressKpis = kpis.filter(k => k.status === KpiStatus.inProgress).length;

    // Calculate average program progress from backend-calculated values
    const avgProgress = totalPrograms > 0
      ? Math.round(programs.reduce((sum, p) => sum + Number(p.progress), 0) / totalPrograms)
      : 0;

    return {
      totalPrograms,
      ongoingPrograms,
      completedPrograms,
      totalKpis,
      achievedKpis,
      inProgressKpis,
      avgProgress,
    };
  }, [programs, kpis]);

  const programStatusData = useMemo(() => [
    { name: 'Perencanaan', value: programs.filter(p => p.status === ProgramStatus.planning).length, fill: 'hsl(var(--chart-1))' },
    { name: 'Berjalan', value: programs.filter(p => p.status === ProgramStatus.ongoing).length, fill: 'hsl(var(--chart-2))' },
    { name: 'Selesai', value: programs.filter(p => p.status === ProgramStatus.completed).length, fill: 'hsl(var(--chart-3))' },
  ], [programs]);

  const kpiStatusData = useMemo(() => [
    { name: 'Belum Tercapai', value: kpis.filter(k => k.status === KpiStatus.notAchieved).length, fill: 'hsl(var(--chart-5))' },
    { name: 'Dalam Progress', value: kpis.filter(k => k.status === KpiStatus.inProgress).length, fill: 'hsl(var(--chart-4))' },
    { name: 'Tercapai', value: kpis.filter(k => k.status === KpiStatus.achieved).length, fill: 'hsl(var(--chart-2))' },
  ], [kpis]);

  // Top 5 programs by progress (backend-calculated)
  const topPrograms = useMemo(() => {
    return [...programs]
      .sort((a, b) => Number(b.progress) - Number(a.progress))
      .slice(0, 5);
  }, [programs]);

  const isLoading = programsLoading || kpisLoading;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Program</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPrograms}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.ongoingPrograms} berjalan, {metrics.completedPrograms} selesai
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KPI</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalKpis}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.achievedKpis} tercapai, {metrics.inProgressKpis} dalam progress
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgProgress}%</div>
            <Progress value={metrics.avgProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KPI Tercapai</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.achievedKpis}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalKpis > 0 ? Math.round((metrics.achievedKpis / metrics.totalKpis) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Program</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={programStatusData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {programStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="value" position="top" className="fill-foreground text-xs font-medium" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status KPI</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={kpiStatusData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {kpiStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="value" position="top" className="fill-foreground text-xs font-medium" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Programs by Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 5 Program (Progress Tertinggi)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPrograms.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada program</p>
            ) : (
              topPrograms.map((program) => (
                <div key={program.id.toString()} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{program.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{program.unit}</p>
                    </div>
                    <span className="ml-2 text-sm font-semibold">{Number(program.progress)}%</span>
                  </div>
                  <Progress value={Number(program.progress)} className="h-2" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
