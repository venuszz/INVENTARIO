import SectionRealtimeToggle from '@/components/SectionRealtimeToggle';

interface HeaderProps {
  isDarkMode: boolean;
  realtimeConnected: boolean;
}

export default function Header({ isDarkMode, realtimeConnected }: HeaderProps) {
  return (
    <div className={`flex justify-between items-center mb-[2vw] pb-[1.5vw] border-b ${
      isDarkMode ? 'border-white/10' : 'border-black/10'
    }`}>
      <div>
        <h1 className="font-light tracking-tight mb-[0.25vw]" style={{ fontSize: 'clamp(1.5rem, 2vw, 2rem)' }}>
          Inventario TLAXCALA
        </h1>
        <p className={`${isDarkMode ? 'text-white/40' : 'text-black/40'}`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
          Consulta y gestión de bienes del estado de Tlaxcala
        </p>
      </div>
      <SectionRealtimeToggle 
        sectionName="No Listado" 
        isConnected={realtimeConnected} 
      />
    </div>
  );
}
