import { Zap, Droplets, RefreshCw, BarChart2, FileBox } from 'lucide-react';
import logoUrl from '../assets/logo.svg';

export default function Sidebar({
  meterType,
  setMeterType,
  dataSource,
  setDataSource,
  onRefresh,
}) {
  return (
    <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 left-0 bg-[#111111] border-r border-[#2a2a2a] z-50">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-center h-8 w-8 relative flex-shrink-0">
          <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full" />
          <img src={logoUrl} alt="UtilityWatch" className="h-full w-full object-contain relative z-10 drop-shadow-md" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight leading-tight">UtilityWatch</h1>
          <p className="text-[9px] text-[#888888] tracking-widest uppercase font-medium">Smart Analyzer</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
        {/* Monitor Section */}
        <div>
          <h3 className="px-2 text-xs font-semibold tracking-widest text-[#4a4a4a] uppercase mb-3">Monitor</h3>
          <div className="space-y-1">
            <button
              onClick={() => setMeterType('electricity')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                meterType === 'electricity'
                  ? 'bg-[#7c3aed]/12 text-[#a78bfa] border-l-[3px] border-[#7c3aed]'
                  : 'text-[#888888] hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
              }`}
            >
              <Zap className="h-4 w-4" />
              Electricity
            </button>
            <button
              onClick={() => setMeterType('water')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                meterType === 'water'
                  ? 'bg-[#7c3aed]/12 text-[#a78bfa] border-l-[3px] border-[#7c3aed]'
                  : 'text-[#888888] hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
              }`}
            >
              <Droplets className="h-4 w-4" />
              Water
            </button>
          </div>
        </div>

        {/* Data Source Section */}
        <div>
          <h3 className="px-2 text-xs font-semibold tracking-widest text-[#4a4a4a] uppercase mb-3">Data Source</h3>
          <div className="space-y-1">
            <button
              onClick={() => setDataSource('demo')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                dataSource === 'demo'
                  ? 'bg-[#7c3aed]/12 text-[#a78bfa] border-l-[3px] border-[#7c3aed]'
                  : 'text-[#888888] hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              Demo Data
            </button>
            <button
              onClick={() => setDataSource('user')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                dataSource === 'user'
                  ? 'bg-[#7c3aed]/12 text-[#a78bfa] border-l-[3px] border-[#7c3aed]'
                  : 'text-[#888888] hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
              }`}
            >
              <FileBox className="h-4 w-4" />
              My Data
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Status */}
      <div className="p-4 border-t border-[#2a2a2a]">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-[#888888]">Live</span>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 text-[#888888] hover:text-[#a78bfa] hover:bg-[#7c3aed]/10 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
