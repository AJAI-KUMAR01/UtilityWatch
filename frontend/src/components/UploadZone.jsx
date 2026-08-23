import { useState, useRef } from 'react';
import { UploadCloud, FileUp } from 'lucide-react';

export default function UploadZone({ onUpload, isUploading }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Create a mock event object for the existing handler
      onUpload({ target: { files: [file] } });
      e.dataTransfer.clearData();
    }
  };

  const handleClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center py-20 px-6 mt-8 mb-12 text-center rounded-3xl border-2 border-dashed transition-all duration-300 shadow-xl cursor-pointer
        ${isDragOver 
          ? 'bg-cyan-900/20 border-cyan-400 shadow-cyan-900/30 scale-[1.01]' 
          : 'bg-navy-900/40 border-slate-700/50 hover:border-cyan-500/50 hover:bg-navy-800/60'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files.length > 0) {
            onUpload(e);
          }
          // Reset the input value so the same file can be selected again if needed
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        className="hidden"
        disabled={isUploading}
      />

      <div className={`h-24 w-24 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${isDragOver ? 'bg-cyan-500/20' : 'bg-slate-800/50'}`}>
        <UploadCloud className={`h-12 w-12 ${isDragOver ? 'text-cyan-400' : 'text-slate-400'}`} />
      </div>

      <h3 className="text-2xl font-bold text-white mb-3">Upload Your Usage Data</h3>
      
      <p className="hidden sm:block text-slate-400 mb-8">
        Drag & drop your CSV file here, or click to browse
      </p>
      <p className="sm:hidden text-slate-400 mb-8">
        Tap to upload your CSV file
      </p>

      <button 
        className="px-6 py-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium rounded-xl hover:bg-cyan-500/20 transition-all pointer-events-none mb-10"
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Choose File'}
      </button>

      <div className="bg-navy-950/50 p-4 rounded-xl text-left border border-slate-800/50 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Expected format</p>
        <code className="block text-cyan-300 bg-cyan-950/50 border border-cyan-900/50 px-3 py-2 rounded-lg text-sm mb-3">
          timestamp, meter_type, usage, unit
        </code>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Example</p>
        <p className="text-xs font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
          2024-01-01 06:00, electricity, 3.5, kWh
        </p>
      </div>
    </div>
  );
}
