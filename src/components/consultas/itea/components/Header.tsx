import SectionRealtimeToggle from '@/components/SectionRealtimeToggle';

interface HeaderProps {
  isDarkMode: boolean;
  realtimeConnected: boolean;
  onReindex: () => void;
}

export default function Header({ isDarkMode, realtimeConnected, onReindex }: HeaderProps) {
  return (
    <div className={`flex justify-between items-center mb-8 pb-6 border-b ${
      isDarkMode ? 'border-white/10' : 'border-black/10'
    }`}>
      <div>
        <h1 className="text-3xl font-light tracking-tight mb-1">
          Inventario ITEA
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
          Consulta y gestión de bienes muebles del ITEA
        </p>
      </div>
      <SectionRealtimeToggle 
        sectionName="ITEA" 
        isConnected={realtimeConnected}
        onReindexClick={onReindex}
      />
    </div>
  );
}
