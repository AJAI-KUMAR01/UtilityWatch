export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeMap = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 animate-fade-in">
      <div
        className={`${sizeMap[size]} rounded-full border-navy-700 border-t-cyan-400 animate-spin`}
        role="status"
        aria-label={text}
      />
      {text && (
        <p className="text-sm text-slate-400 font-medium tracking-wide">{text}</p>
      )}
    </div>
  );
}
