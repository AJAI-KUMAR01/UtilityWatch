import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 animate-fade-in">
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-red-400 mb-1">Failed to load data</p>
        <p className="text-xs text-slate-500 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          id="error-retry-btn"
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-cyan-400 border border-cyan-400/30 rounded-lg hover:bg-cyan-400/10 transition-all duration-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
