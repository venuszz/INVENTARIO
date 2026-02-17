import { AlertCircle, X, FileDigit, ListChecks, ShieldAlert, KeyRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { DeleteType, ItemToDelete } from '../types';

interface DeleteModalProps {
  show: boolean;
  deleteType: DeleteType | null;
  itemToDelete: ItemToDelete | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

/**
 * Unified delete confirmation modal with two-step verification
 * Step 1: Shows warning about permanent deletion
 * Step 2: Requires typing "ELIMINAR" to confirm
 */
export const DeleteModal: React.FC<DeleteModalProps> = ({
  show,
  deleteType,
  itemToDelete,
  onConfirm,
  onCancel,
  isDarkMode
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmValid, setIsConfirmValid] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (show) {
      setStep(1);
      setConfirmText('');
      setIsConfirmValid(false);
    }
  }, [show]);

  // Validate confirmation text
  useEffect(() => {
    setIsConfirmValid(confirmText.toUpperCase() === 'ELIMINAR');
  }, [confirmText]);

  if (!show) return null;

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setConfirmText('');
  };

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${
      isDarkMode ? 'bg-black/80' : 'bg-black/50'
    }`}>
      <div className={`rounded-lg border w-full max-w-md overflow-hidden ${
        isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
                {step === 1 ? (
                  <AlertCircle size={20} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
                ) : (
                  <ShieldAlert size={20} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
                )}
              </div>
              <div>
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {step === 1 ? 'Confirmar eliminación' : 'Verificación requerida'}
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  {step === 1 ? 'Paso 1 de 2' : 'Paso 2 de 2'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-black/10 text-black'
              }`}
            >
              <X size={16} />
            </button>
          </div>

          {/* Step 1: Warning */}
          {step === 1 && (
            <>
              {/* Item Info */}
              <div className={`rounded-lg border p-3 mb-4 ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                {deleteType === 'folio' && itemToDelete?.folioResguardo && (
                  <div className="flex items-center gap-3">
                    <FileDigit className={`h-4 w-4 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        Folio: {itemToDelete.folioResguardo}
                      </p>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-white/60' : 'text-black/60'
                      }`}>
                        Se eliminarán todos los artículos asociados
                      </p>
                    </div>
                  </div>
                )}

                {deleteType === 'selected' && itemToDelete?.articulos && (
                  <div className="flex items-center gap-3">
                    <ListChecks className={`h-4 w-4 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        {itemToDelete.articulos.length} artículos seleccionados
                      </p>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-white/60' : 'text-black/60'
                      }`}>
                        Se eliminarán los artículos marcados
                      </p>
                    </div>
                  </div>
                )}

                {deleteType === 'single' && itemToDelete?.singleArticulo && (
                  <div className="flex items-center gap-3">
                    <FileDigit className={`h-4 w-4 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        {itemToDelete.singleArticulo.num_inventario}
                      </p>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-white/60' : 'text-black/60'
                      }`}>
                        {itemToDelete.singleArticulo.descripcion}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Warning Message */}
              <div className={`rounded-lg border p-4 mb-6 ${
                isDarkMode
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex gap-3">
                  <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                  <div className="space-y-2">
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-red-400' : 'text-red-700'
                    }`}>
                      Advertencia: Esta acción es permanente
                    </p>
                    <ul className={`text-xs space-y-1 ${
                      isDarkMode ? 'text-red-300/80' : 'text-red-600/80'
                    }`}>
                      <li>• Se eliminará el historial completo del resguardo</li>
                      <li>• Se perderá el registro de quién tuvo los bienes</li>
                      <li>• No se podrá recuperar esta información</li>
                      <li>• Los detalles del resguardo serán borrados permanentemente</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'border-white/10 hover:bg-white/5 text-white'
                      : 'border-black/10 hover:bg-black/5 text-black'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleNext}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* Step 2: Verification */}
          {step === 2 && (
            <>
              {/* Verification Instructions */}
              <div className={`rounded-lg border p-4 mb-4 ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex gap-3 mb-3">
                  <KeyRound className={`h-5 w-5 flex-shrink-0 ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      Para confirmar la eliminación permanente
                    </p>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Escribe la palabra <span className="font-mono font-bold">ELIMINAR</span> en el campo de abajo
                    </p>
                  </div>
                </div>

                {/* Input Field */}
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Escribe ELIMINAR"
                  autoFocus
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${
                    confirmText && !isConfirmValid
                      ? isDarkMode
                        ? 'border-red-500/50 bg-red-500/5 text-red-400'
                        : 'border-red-500/50 bg-red-50 text-red-600'
                      : isConfirmValid
                        ? isDarkMode
                          ? 'border-green-500/50 bg-green-500/5 text-green-400'
                          : 'border-green-500/50 bg-green-50 text-green-600'
                        : isDarkMode
                          ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40'
                          : 'border-black/10 bg-black/5 text-black placeholder:text-black/40'
                  }`}
                />

                {/* Validation Feedback */}
                {confirmText && (
                  <p className={`text-xs mt-2 ${
                    isConfirmValid
                      ? isDarkMode ? 'text-green-400' : 'text-green-600'
                      : isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {isConfirmValid ? '✓ Verificación correcta' : '✗ Debe escribir exactamente "ELIMINAR"'}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'border-white/10 hover:bg-white/5 text-white'
                      : 'border-black/10 hover:bg-black/5 text-black'
                  }`}
                >
                  Atrás
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!isConfirmValid}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isConfirmValid
                      ? isDarkMode
                        ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
                        : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                      : isDarkMode
                        ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                        : 'bg-black/5 text-black/30 border border-black/10 cursor-not-allowed'
                  }`}
                >
                  Eliminar permanentemente
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
