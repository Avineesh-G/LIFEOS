import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LifeOS UI Error Caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="card p-6 text-center space-y-4 my-8 border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-primary-light dark:text-primary-dark">View Recovery</h3>
            <p className="text-xs text-secondary-light dark:text-secondary-dark max-w-sm mx-auto">
              An unexpected render error occurred. Click reload to refresh with your saved data.
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn-pill px-4 py-2 text-xs inline-flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
          >
            <RefreshCw size={14} /> Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
