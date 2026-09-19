import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  level?: 'root' | 'route';
  onReset?: () => void;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[LifeOS ${this.props.level || 'component'} ErrorBoundary]`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isRoot = this.props.level === 'root';
      const isDev = import.meta.env.DEV;

      return (
        <div
          role="alert"
          className={
            isRoot
              ? 'min-h-screen w-full flex items-center justify-center p-4 bg-[#FDFDFD] dark:bg-[#121316] text-[#1E293B] dark:text-[#F1F5F9]'
              : 'w-full my-6 p-6 flex flex-col items-center justify-center'
          }
        >
          <div className="w-full max-w-lg rounded-[28px] p-6 sm:p-7 border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 shadow-[0_12px_32px_rgba(239,68,68,0.12)] text-center space-y-4">
            <div className="w-14 h-14 rounded-[20px] bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle size={28} strokeWidth={2.2} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold font-sans tracking-tight">
                {this.props.fallbackTitle || (isRoot ? 'Application Recovery' : 'Interface Recovery')}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 max-w-sm mx-auto leading-relaxed">
                An unexpected render issue occurred. You can attempt to retry the interface or reload the app with your saved data.
              </p>
            </div>

            {/* Error message detail (visible in dev mode for instant diagnosis) */}
            {this.state.error && (
              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-left font-mono text-[11px] max-h-36 overflow-y-auto break-words select-text">
                <p className="font-bold text-red-600 dark:text-red-400 mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {isDev && this.state.error.stack && (
                  <pre className="text-neutral-500 dark:text-neutral-400 text-[10px] whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-full text-xs font-bold border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-500/10 active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Try again
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function RouteErrorBoundary({ children, routeName }: { children: ReactNode; routeName?: string }) {
  return (
    <ErrorBoundary level="route" fallbackTitle={routeName ? `${routeName} View Recovery` : undefined}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
