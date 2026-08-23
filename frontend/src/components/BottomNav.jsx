import { Zap, Droplets, BarChart2, FileBox } from 'lucide-react';

export default function BottomNav({ meterType, setMeterType, dataSource, setDataSource }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d1426] border-t border-slate-800/80 z-50 px-2 py-2 pb-safe flex items-center justify-around">
      <button
        onClick={() => setMeterType('electricity')}
        className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
          meterType === 'electricity' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Zap className="h-5 w-5 mb-1" />
        <span className="text-[10px] font-medium">Power</span>
      </button>

      <button
        onClick={() => setMeterType('water')}
        className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
          meterType === 'water' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Droplets className="h-5 w-5 mb-1" />
        <span className="text-[10px] font-medium">Water</span>
      </button>

      <div className="w-px h-8 bg-slate-800/60 mx-1" />

      <button
        onClick={() => setDataSource('demo')}
        className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
          dataSource === 'demo' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <BarChart2 className="h-5 w-5 mb-1" />
        <span className="text-[10px] font-medium">Demo</span>
      </button>

      <button
        onClick={() => setDataSource('user')}
        className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
          dataSource === 'user' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <FileBox className="h-5 w-5 mb-1" />
        <span className="text-[10px] font-medium">My Data</span>
      </button>
    </nav>
  );
}
