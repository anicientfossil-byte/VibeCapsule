import React from 'react';

interface RetroCameraToggleProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  sublabel?: string;
}

export const RetroCameraToggle: React.FC<RetroCameraToggleProps> = ({
  label,
  checked,
  onCheckedChange,
  sublabel
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 border-b border-purple-500/15 last:border-b-0">
      <div>
        <div className="text-xs sm:text-sm font-sans font-semibold tracking-wide text-white uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-magenta-400 bg-[#d946ef] inline-block shadow-[0_0_8px_#d946ef]" />
          {label}
        </div>
        {sublabel && (
          <div className="text-[11px] font-sans text-purple-300/70 mt-1 pl-3.5 leading-relaxed">
            {sublabel}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pl-3.5 sm:pl-0">
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase transition-colors ${
            checked
              ? 'bg-[#d946ef]/20 border-[#d946ef] text-[#f472b6] shadow-[0_0_10px_rgba(217,70,239,0.3)]'
              : 'bg-black/40 border-purple-900/60 text-purple-400/50'
          }`}
        >
          {checked ? 'ACTIVE' : 'OFF'}
        </span>

        <div
          role="switch"
          aria-checked={checked}
          tabIndex={0}
          onClick={() => onCheckedChange(!checked)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              onCheckedChange(!checked);
            }
          }}
          className={`relative w-14 h-7 cursor-pointer select-none rounded-full border border-purple-500/30 transition-all p-0.5 ${
            checked
              ? 'bg-gradient-to-r from-purple-900/80 to-[#d946ef]/50 shadow-[0_0_14px_rgba(217,70,239,0.35)]'
              : 'bg-black/60'
          }`}
          title={`Toggle ${label}`}
        >
          {/* Sliding glowing pill lever */}
          <div
            className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-200 ease-out ${
              checked
                ? 'translate-x-7 bg-gradient-to-br from-white to-[#fbcfe8] shadow-[0_0_10px_#d946ef]'
                : 'translate-x-0 bg-neutral-400'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                checked ? 'bg-[#d946ef]' : 'bg-neutral-600'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
