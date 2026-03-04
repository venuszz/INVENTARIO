# INEA Obsoletos - Field History Icons Fix

## Problema Identificado

Los íconos de historial de cambios NO aparecen en el panel de detalles de INEA Obsoletos, aunque:
- Los datos SÍ se están obteniendo correctamente del API
- El hook `useFieldHistory` SÍ está funcionando
- Los cambios SÍ se están guardando en la base de datos

## Causa Raíz

En el archivo `src/components/consultas/inea/obsoletos/components/DetailPanel.tsx`, la mayoría de los componentes `DetailCard` NO tienen los parámetros necesarios para mostrar el historial:

```typescript
// ❌ INCORRECTO - Sin parámetros de historial
<DetailCard label="Forma de Adquisición" value={selectedItem.formadq || 'No especificado'} isDarkMode={isDarkMode} />

// ✅ CORRECTO - Con parámetros de historial
<DetailCard 
  label="Forma de Adquisición" 
  value={selectedItem.formadq || 'No especificado'} 
  isDarkMode={isDarkMode}
  idMueble={selectedItem.id}
  fieldName="formadq"
  hasHistory={fieldsWithHistory['formadq']}
  fieldHistory={fieldHistory}
/>
```

## Evidencia de los Logs

Los logs muestran claramente el problema:

```
🟡 [DetailCard - Forma de Adquisición] Render info: {
  label: 'Forma de Adquisición', 
  fieldName: undefined,  // ❌ UNDEFINED!
  hasHistory: false, 
  historyLength: 0
}
```

Mientras que los datos SÍ están disponibles:

```
🔍 [INEA Obsoletos ViewMode Debug] Fields with history: {formadq: true}
🔍 [INEA Obsoletos ViewMode Debug] Field history data: {formadq: Array(2)}
```

## Solución

Agregar los parámetros faltantes a TODOS los DetailCard en la línea ~813-827 del archivo:

```typescript
<DetailCard 
  label="Valor" 
  value={selectedItem.valor ? `${parseFloat(String(selectedItem.valor)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'} 
  isDarkMode={isDarkMode}
  idMueble={selectedItem.id}
  fieldName="valor"
  hasHistory={fieldsWithHistory['valor']}
  fieldHistory={fieldHistory}
/>
<DetailCard label="Fecha de Adquisición" value={formatDate(selectedItem.f_adq) || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="f_adq" hasHistory={fieldsWithHistory['f_adq']} fieldHistory={fieldHistory} />
<DetailCard label="Forma de Adquisición" value={selectedItem.formadq || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="formadq" hasHistory={fieldsWithHistory['formadq']} fieldHistory={fieldHistory} />
<DetailCard label="Proveedor" value={selectedItem.proveedor || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="proveedor" hasHistory={fieldsWithHistory['proveedor']} fieldHistory={fieldHistory} />
<DetailCard label="Factura" value={selectedItem.factura || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="factura" hasHistory={fieldsWithHistory['factura']} fieldHistory={fieldHistory} />
<DetailCard label="Estado Físico" value={selectedItem.estado || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="estado" hasHistory={fieldsWithHistory['estado']} fieldHistory={fieldHistory} />
<DetailCard label="Estado (Ubicación)" value={selectedItem.ubicacion_es || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="ubicacion_es" hasHistory={fieldsWithHistory['ubicacion_es']} fieldHistory={fieldHistory} />
<DetailCard label="Municipio" value={selectedItem.ubicacion_mu || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="ubicacion_mu" hasHistory={fieldsWithHistory['ubicacion_mu']} fieldHistory={fieldHistory} />
<DetailCard label="Nomenclatura" value={selectedItem.ubicacion_no || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="ubicacion_no" hasHistory={fieldsWithHistory['ubicacion_no']} fieldHistory={fieldHistory} />
<DetailCard label="Área" value={isSyncing ? null : (selectedItem.area?.nombre || 'No especificado')} isDarkMode={isDarkMode} isSyncing={isSyncing} idMueble={selectedItem.id} fieldName="id_area" hasHistory={fieldsWithHistory['id_area']} fieldHistory={fieldHistory} />
<DetailCard label="Director/Jefe de Área" value={isSyncing ? null : (selectedItem.directorio?.nombre || selectedItem.usufinal || 'No especificado')} isDarkMode={isDarkMode} isSyncing={isSyncing} idMueble={selectedItem.id} fieldName="id_directorio" hasHistory={fieldsWithHistory['id_directorio']} fieldHistory={fieldHistory} />
```

## Campos que Necesitan los Parámetros

Los siguientes DetailCard necesitan agregar los parámetros:
1. ✅ ID Inventario - Ya tiene los parámetros
2. ✅ Rubro - Ya tiene los parámetros  
3. ✅ Descripción - Ya tiene los parámetros
4. ❌ Valor - FALTA
5. ❌ Fecha de Adquisición - FALTA
6. ❌ Forma de Adquisición - FALTA
7. ❌ Proveedor - FALTA
8. ❌ Factura - FALTA
9. ❌ Estado Físico - FALTA
10. ❌ Estado (Ubicación) - FALTA
11. ❌ Municipio - FALTA
12. ❌ Nomenclatura - FALTA
13. ❌ Área - FALTA
14. ❌ Director/Jefe de Área - FALTA

## Archivo a Modificar

`src/components/consultas/inea/obsoletos/components/DetailPanel.tsx` - Líneas 813-827 aproximadamente

## Nota

El sistema de historial de cambios está funcionando correctamente. Solo falta pasar los parámetros correctos a los componentes DetailCard para que puedan renderizar los íconos.
