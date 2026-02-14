import { Component, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import ProgramCalendarTab from './ProgramCalendarTab';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

class CalendarErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      resetKey: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Calendar tab error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      resetKey: this.state.resetKey + 1,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-4">
          {/* Header Scaffold - Always visible */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Program Calendar
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and track program schedules visually
              </p>
            </div>
          </div>

          {/* Error Fallback */}
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Unable to Load Calendar</CardTitle>
              </div>
              <CardDescription>
                The calendar encountered an error while loading. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {this.state.error && (
                  <div className="rounded-md bg-muted p-3 text-sm font-mono text-muted-foreground">
                    {this.state.error.message}
                  </div>
                )}
                <Button onClick={this.handleReset} className="w-full sm:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}

export default function ProgramCalendarTabBoundary() {
  const queryClient = useQueryClient();

  const handleReset = () => {
    // Invalidate all calendar-related queries
    queryClient.invalidateQueries({ queryKey: ['programs-in-range'] });
    queryClient.invalidateQueries({ queryKey: ['agenda-items-in-range'] });
    queryClient.invalidateQueries({ queryKey: ['kpis-with-deadlines-in-range'] });
    queryClient.invalidateQueries({ queryKey: ['divisions'] });
    queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
  };

  return (
    <CalendarErrorBoundary onReset={handleReset}>
      <ProgramCalendarTab />
    </CalendarErrorBoundary>
  );
}
