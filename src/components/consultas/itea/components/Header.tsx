import SectionRealtimeToggle from '@/components/SectionRealtimeToggle';

interface HeaderProps {
  isDarkMode: boolean;
  realtimeConnected: boolean;
  onReindex: () => void;
}

export default function Header({ isDarkMode, realtimeConnected, onReindex }: HeaderProps) {
  return (
    <div className={`flex justify-between items-center mb-[2vw] pb-[1.5vw] border-b ${
      isDarkMode ? 'border-white/10' : 'border-black/10'
    }`}>
      <div>
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-light tracking-tight mb-[0.25vw]">
          Inventario ITEJPA
        </h1>
        <p className={`text-[clamp(0.75rem,0.875vw,0.875rem)] ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
          Consulta y gestión de bienes muebles del ITEJPA
        </p>
      </div>
      <SectionRealtimeToggle 
        sectionName="ITEJPA" 
        isConnected={realtimeConnected}
        onReindexClick={onReindex}
      />
    </div>
  );
}
