import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Key } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleClearDataAndReload = () => {
    try {
      localStorage.removeItem('clerk_pub_key');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-5 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Terjadi Kesalahan Aplikasi</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {this.state.error?.message || 'Aplikasi mengalami kendala saat memuat komponen.'}
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono text-left overflow-x-auto max-h-24">
              {this.state.error?.toString()}
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Coba Muat Ulang</span>
              </button>

              <button
                onClick={this.handleClearDataAndReload}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Key className="w-4 h-4 text-amber-400" />
                <span>Reset Key Auth / Gunakan Mode Tamu</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
