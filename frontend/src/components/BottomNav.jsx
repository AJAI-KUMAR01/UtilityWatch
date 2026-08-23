import { Zap, Droplets, BarChart2, FileBox } from 'lucide-react';

export default function BottomNav({ meterType, setMeterType, dataSource, setDataSource }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#2a2a2a] z-50 px-2 py-2 pb-safe flex items-center justify-around">
      <button
        onClick={() => setMeterType('electricity')}
        className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
          meterType === 'electricity' ? 'text-[#a78bfa]' : 'text-[#888888] hover:text-white'
        }`}
      >
        <Zap className="h-5 w-5 mb-1" />
        <span className="text-[10px] font-medium">Power</span>
      </button>

      <button
        onClick={() => setMeterType('water')}
        className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
          meterType === 'water' ? 'text-[#a78bfa]' : 'text-[#888888] hover:text-white'
        }`}
      >
        <Droplets className="h-5 w-5 mb-1" />
        <span className="text-[10px] font-medium">Water</span>
      </button>

      <div className="w-px h-8 bg-[#2a2a2a] mx-1" />

      <button
        onClick={() => setDataSource('demo')}
        className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
          dataSource === 'demo' ? 'text-[#a78bfa]' : 'text-[#888888] hover:text-white'
        }`}
      >
        <BarChart2 className="h-5 w-5 mb-1" />
        <span className="text-[10px] font-medium">Demo</span>
      </button>

      <button
        onClick={() => setDataSource('user')}
        className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
          dataSource === 'user' ? 'text-[#a78bfa]' : 'text-[#888888] hover:text-white'
        }`}
      >
        <FileBox className="h-5 w-5 mb-1" />
        <span className="text-[10px] font-medium">My Data</span>
      </button>
    </nav>
  );
}
