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
          ? 'bg-[#7c3aed]/5 border-[#7c3aed] shadow-[#7c3aed]/20 scale-[1.01]' 
          : 'bg-[#161616] border-[#2a2a2a] hover:border-[#4a4a4a] hover:bg-[#1a1a1a]'
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

      <div className={`h-24 w-24 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${isDragOver ? 'bg-[#7c3aed]/20' : 'bg-[#111111]'}`}>
        <UploadCloud className={`h-12 w-12 ${isDragOver ? 'text-[#7c3aed]' : 'text-[#888888]'}`} />
      </div>

      <h3 className="text-2xl font-bold text-white mb-3">Upload Your Usage Data</h3>
      
      <p className="hidden sm:block text-[#888888] mb-8">
        Drag & drop your CSV file here, or click to browse
      </p>
      <p className="sm:hidden text-[#888888] mb-8">
        Tap to upload your CSV file
      </p>

      <button 
        className="px-6 py-2.5 bg-gradient-to-br from-[#7c3aed] to-[#2563eb] text-white border-0 font-medium rounded-xl hover:from-[#a78bfa] hover:to-[#60a5fa] transition-all pointer-events-none mb-10"
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Choose File'}
      </button>

      <div className="bg-[#111111] p-4 rounded-xl text-left border border-[#2a2a2a] w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-[#888888] uppercase tracking-wider font-semibold mb-2">Expected format</p>
        <code className="block text-[#a78bfa] bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-3 py-2 rounded-lg text-sm mb-3">
          timestamp, meter_type, usage, unit
        </code>
        <p className="text-xs text-[#888888] uppercase tracking-wider font-semibold mb-1">Example</p>
        <p className="text-xs font-mono text-[#555555] bg-[#0a0a0a] border border-[#2a2a2a] px-2 py-1 rounded">
          2024-01-01 06:00, electricity, 3.5, kWh
        </p>
      </div>
    </div>
  );
}
