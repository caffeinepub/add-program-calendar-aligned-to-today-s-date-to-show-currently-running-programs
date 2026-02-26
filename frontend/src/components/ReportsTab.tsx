import { useState, useMemo } from 'react';
import { useGetAllPrograms, useGetAllKPIs, useGetAllTeamMembers } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ProgramPriority } from '../backend';

export default function ReportsTab() {
  const { data: programs = [], isLoading: programsLoading } = useGetAllPrograms();
  const { data: kpis = [], isLoading: kpisLoading } = useGetAllKPIs();
  const { data: teamMembers = [], isLoading: teamMembersLoading } = useGetAllTeamMembers();
  
  const [reportType, setReportType] = useState<'programs' | 'kpis'>('programs');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Get unique teams and divisions
  const teams = useMemo(() => {
    const uniqueTeams = Array.from(new Set([
      ...programs.map(p => p.personInCharge.name),
      ...kpis.map(k => k.team.name),
    ]));
    return uniqueTeams.sort();
  }, [programs, kpis]);

  const divisions = useMemo(() => {
    const uniqueDivisions = Array.from(new Set([
      ...programs.map(p => p.unit),
      ...teamMembers.map(m => m.division),
    ]));
    return uniqueDivisions.sort();
  }, [programs, teamMembers]);

  // Filter data based on selected filters
  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      const matchesTeam = teamFilter === 'all' || program.personInCharge.name === teamFilter;
      const matchesDivision = divisionFilter === 'all' || program.unit === divisionFilter;
      const matchesPriority = priorityFilter === 'all' || program.priority === priorityFilter;
      return matchesTeam && matchesDivision && matchesPriority;
    }).sort((a, b) => {
      // Sort by priority: high -> middle -> low
      const priorityOrder = { high: 0, middle: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [programs, teamFilter, divisionFilter, priorityFilter]);

  const filteredKpis = useMemo(() => {
    return kpis.filter(kpi => {
      const matchesTeam = teamFilter === 'all' || kpi.team.name === teamFilter;
      const program = programs.find(p => p.id === kpi.relatedProgramId);
      const matchesDivision = divisionFilter === 'all' || (program && program.unit === divisionFilter);
      return matchesTeam && matchesDivision;
    });
  }, [kpis, programs, teamFilter, divisionFilter]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: 'Perencanaan',
      ongoing: 'Berjalan',
      completed: 'Selesai',
      notAchieved: 'Belum Tercapai',
      inProgress: 'Dalam Progress',
      achieved: 'Tercapai',
    };
    return labels[status] || status;
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      monthly: 'Bulanan',
      quarterly: 'Triwulan',
      annual: 'Tahunan',
    };
    return labels[period] || period;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: 'Tinggi',
      middle: 'Sedang',
      low: 'Rendah',
    };
    return labels[priority] || priority;
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      let csvContent = '';
      let filename = '';

      if (reportType === 'programs') {
        csvContent = 'Nama Program,Deskripsi,Unit/Divisi,Penanggung Jawab,Tanggal Mulai,Tanggal Selesai,Prioritas,Status,Progress\n';
        filteredPrograms.forEach(program => {
          const row = [
            `"${program.name}"`,
            `"${program.description}"`,
            `"${program.unit}"`,
            `"${program.personInCharge.name}"`,
            format(new Date(Number(program.startDate)), 'dd/MM/yyyy'),
            format(new Date(Number(program.endDate)), 'dd/MM/yyyy'),
            getPriorityLabel(program.priority),
            getStatusLabel(program.status),
            `${program.progress}%`,
          ].join(',');
          csvContent += row + '\n';
        });
        filename = `laporan-program-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      } else {
        csvContent = 'Nama KPI,Program Terkait,Tim/PIC,Target,Realisasi,Periode,Status\n';
        filteredKpis.forEach(kpi => {
          const program = programs.find(p => p.id === kpi.relatedProgramId);
          const row = [
            `"${kpi.name}"`,
            `"${program?.name || 'N/A'}"`,
            `"${kpi.team.name}"`,
            Number(kpi.targetValue),
            Number(kpi.realizationValue),
            getPeriodLabel(kpi.period),
            getStatusLabel(kpi.status),
          ].join(',');
          csvContent += row + '\n';
        });
        filename = `laporan-kpi-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      }

      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success('Laporan berhasil diekspor ke Excel');
    } catch (error) {
      toast.error('Gagal mengekspor laporan');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const filterInfo: string[] = [];
      if (teamFilter !== 'all') filterInfo.push(`Tim: ${teamFilter}`);
      if (divisionFilter !== 'all') filterInfo.push(`Divisi: ${divisionFilter}`);
      if (priorityFilter !== 'all' && reportType === 'programs') filterInfo.push(`Prioritas: ${getPriorityLabel(priorityFilter)}`);
      const filterText = filterInfo.length > 0 ? ` (${filterInfo.join(', ')})` : '';

      // Create HTML content for PDF
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Laporan ${reportType === 'programs' ? 'Program' : 'KPI'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header { margin-bottom: 20px; }
            .info { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .priority-high { background-color: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; }
            .priority-middle { background-color: #eab308; color: white; padding: 2px 8px; border-radius: 4px; }
            .priority-low { background-color: #16a34a; color: white; padding: 2px 8px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan ${reportType === 'programs' ? 'Program Timeline' : 'KPI Tim'}${filterText}</h1>
            <div class="info">Tanggal Laporan: ${format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}</div>
            <div class="info">Periode: ${format(new Date(), 'MMMM yyyy', { locale: idLocale })}</div>
          </div>
      `;

      if (reportType === 'programs') {
        htmlContent += `
          <table>
            <thead>
              <tr>
                <th>Nama Program</th>
                <th>Unit/Divisi</th>
                <th>Penanggung Jawab</th>
                <th>Tanggal</th>
                <th>Prioritas</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
        `;
        filteredPrograms.forEach(program => {
          const priorityClass = program.priority === 'high' ? 'priority-high' : program.priority === 'middle' ? 'priority-middle' : 'priority-low';
          htmlContent += `
            <tr>
              <td>${program.name}</td>
              <td>${program.unit}</td>
              <td>${program.personInCharge.name}</td>
              <td>${format(new Date(Number(program.startDate)), 'dd/MM/yyyy')} - ${format(new Date(Number(program.endDate)), 'dd/MM/yyyy')}</td>
              <td><span class="${priorityClass}">${getPriorityLabel(program.priority)}</span></td>
              <td>${getStatusLabel(program.status)}</td>
              <td>${program.progress}%</td>
            </tr>
          `;
        });
        htmlContent += `
            </tbody>
          </table>
          <div class="summary">
            <h3>Ringkasan</h3>
            <p>Total Program: ${filteredPrograms.length}</p>
            <p>Program Prioritas Tinggi: ${filteredPrograms.filter(p => p.priority === 'high').length}</p>
            <p>Program Berjalan: ${filteredPrograms.filter(p => p.status === 'ongoing').length}</p>
            <p>Program Selesai: ${filteredPrograms.filter(p => p.status === 'completed').length}</p>
          </div>
        `;
      } else {
        htmlContent += `
          <table>
            <thead>
              <tr>
                <th>Nama KPI</th>
                <th>Tim/PIC</th>
                <th>Target</th>
                <th>Realisasi</th>
                <th>Periode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
        `;
        filteredKpis.forEach(kpi => {
          htmlContent += `
            <tr>
              <td>${kpi.name}</td>
              <td>${kpi.team.name}</td>
              <td>${Number(kpi.targetValue).toLocaleString('id-ID')}</td>
              <td>${Number(kpi.realizationValue).toLocaleString('id-ID')}</td>
              <td>${getPeriodLabel(kpi.period)}</td>
              <td>${getStatusLabel(kpi.status)}</td>
            </tr>
          `;
        });
        htmlContent += `
            </tbody>
          </table>
          <div class="summary">
            <h3>Ringkasan</h3>
            <p>Total KPI: ${filteredKpis.length}</p>
            <p>KPI Tercapai: ${filteredKpis.filter(k => k.status === 'achieved').length}</p>
            <p>Persentase Pencapaian: ${filteredKpis.length > 0 ? Math.round((filteredKpis.filter(k => k.status === 'achieved').length / filteredKpis.length) * 100) : 0}%</p>
          </div>
        `;
      }

      htmlContent += `
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `laporan-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.html`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success('Laporan berhasil diekspor ke PDF (HTML)');
    } catch (error) {
      toast.error('Gagal mengekspor laporan');
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = programsLoading || kpisLoading || teamMembersLoading;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ekspor Laporan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Laporan</Label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as 'programs' | 'kpis')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="programs">Laporan Program Timeline</SelectItem>
                  <SelectItem value="kpis">Laporan KPI Tim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Filter Tim</Label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tim</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filter Divisi</Label>
                <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Divisi</SelectItem>
                    {divisions.map(division => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {reportType === 'programs' && (
              <div className="space-y-2">
                <Label>Filter Prioritas</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Prioritas</SelectItem>
                    <SelectItem value={ProgramPriority.high}>Tinggi</SelectItem>
                    <SelectItem value={ProgramPriority.middle}>Sedang</SelectItem>
                    <SelectItem value={ProgramPriority.low}>Rendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={exportToPDF}
                disabled={isLoading || isExporting}
                className="flex-1"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Ekspor ke PDF
              </Button>
              <Button
                onClick={exportToCSV}
                disabled={isLoading || isExporting}
                variant="outline"
                className="flex-1"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                Ekspor ke Excel
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">Informasi Laporan</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Laporan mencakup data {reportType === 'programs' ? 'program' : 'KPI'} yang difilter</li>
              <li>• Gunakan filter tim{reportType === 'programs' ? ', divisi, dan prioritas' : ' dan divisi'} untuk menyaring data</li>
              <li>• Format PDF cocok untuk presentasi dan dokumentasi</li>
              <li>• Format Excel cocok untuk analisis data lebih lanjut</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Data</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reportType === 'programs' ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Total {filteredPrograms.length} program akan diekspor
                {(teamFilter !== 'all' || divisionFilter !== 'all' || priorityFilter !== 'all') && ' (terfilter)'}
              </p>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Program Prioritas Tinggi:</span>
                  <span className="font-medium">{filteredPrograms.filter(p => p.priority === 'high').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Program Prioritas Sedang:</span>
                  <span className="font-medium">{filteredPrograms.filter(p => p.priority === 'middle').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Program Prioritas Rendah:</span>
                  <span className="font-medium">{filteredPrograms.filter(p => p.priority === 'low').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Program Berjalan:</span>
                  <span className="font-medium">{filteredPrograms.filter(p => p.status === 'ongoing').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Program Selesai:</span>
                  <span className="font-medium">{filteredPrograms.filter(p => p.status === 'completed').length}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Total {filteredKpis.length} KPI akan diekspor
                {(teamFilter !== 'all' || divisionFilter !== 'all') && ' (terfilter)'}
              </p>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>KPI Belum Tercapai:</span>
                  <span className="font-medium">{filteredKpis.filter(k => k.status === 'notAchieved').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>KPI Dalam Progress:</span>
                  <span className="font-medium">{filteredKpis.filter(k => k.status === 'inProgress').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>KPI Tercapai:</span>
                  <span className="font-medium">{filteredKpis.filter(k => k.status === 'achieved').length}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
