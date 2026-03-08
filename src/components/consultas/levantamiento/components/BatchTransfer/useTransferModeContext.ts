/**
 * Hook para acceder al contexto de transferencia desde cualquier componente
 * Retorna undefined si no está dentro del provider
 */

import { useContext } from 'react';
import { TransferModeContext } from './TransferModeProvider';

export function useTransferModeContext() {
  return useContext(TransferModeContext);
}
