import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface PdfArticulo {
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    estado: string | null;
    origen?: string | null; // INEA o ITEA
    folio_baja?: string | null; // Añadimos el folio_baja opcional
    resguardante?: string | null; // Añadimos el resguardante opcional
}

interface PdfFirma {
    concepto: string;
    nombre: string;
    puesto: string;
}

interface PdfDataBaja {
    folio_resguardo: string;
    folio_baja: string;
    fecha: string;
    director: string | undefined;
    area: string;
    puesto: string;
    resguardante: string;
    articulos: PdfArticulo[];
    firmas?: PdfFirma[]; // Agregando campo opcional de firmas
}

const styles = StyleSheet.create({
    page: {
        fontSize: 10,
        padding: 25,
        backgroundColor: '#f8fafc',
        color: '#222',
    },
    header: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
        color: '#b91c1c',
        textAlign: 'center',
        marginTop: 5,
    },
    section: {
        marginTop: 20,
        marginBottom: 12,
    },
    label: {
        fontWeight: 'bold',
        color: '#334155',
    },
    table: {
        width: '100%',
        marginTop: 8,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#64748b',
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableHeader: {
        backgroundColor: '#fee2e2',
    },
    tableCell: {
        padding: 6,
        fontSize: 7,
        borderRightWidth: 1,
        borderRightColor: '#64748b',
        borderBottomWidth: 1,
        borderBottomColor: '#64748b',
        flexGrow: 1,
        textAlign: 'center',
    },
    tableCellHeader: {
        fontWeight: 'bold',
        backgroundColor: '#fee2e2',
        textAlign: 'center',
        fontSize: 10,
    },
    signature: {
        marginTop: 12,
        flexDirection: 'row',
    },
    signatureBox: {
        width: '40%',
        borderTopWidth: 1,
        borderTopColor: '#64748b',
        textAlign: 'center',
        paddingTop: 8,
        fontSize: 7,
    },
    footer: {
        position: 'absolute',
        left: 25,
        right: 25,
        bottom: 20,
        width: 'auto',
    },
});

export const BajaPDF = ({ data }: { data: PdfDataBaja }) => {
    // Separar artículos por origen
    const articulosINEA = data.articulos.filter(a => a.origen === 'INEA');
    const articulosITEA = data.articulos.filter(a => a.origen === 'ITEA');

    // Verificar si hay diferentes folios de baja
    const hasMultipleFolios = data.articulos.some(a => a.folio_baja && a.folio_baja !== data.folio_baja);

    // Detectar si hay más de un resguardante
    const uniqueResguardantes = Array.from(new Set(data.articulos.map(a => a.resguardante)));
    const showResguardanteColumn = uniqueResguardantes.length > 1;

    // Si data.firmas está vacío, crear firmas por defecto
    const defaultFirmas: PdfFirma[] = [
        {
            concepto: 'Autoriza',
            nombre: 'Por asignar',
            puesto: 'DIRECTOR(A) ADMIN. Y FINANZAS'
        },
        {
            concepto: 'Conocimiento',
            nombre: 'Por asignar',
            puesto: 'DIRECTOR(A) RECURSOS MATERIALES'
        },
        {
            concepto: 'Responsable',
            nombre: data.director || '',
            puesto: data.puesto || ''
        }
    ];

    const firmasToUse = data.firmas?.length ? data.firmas : defaultFirmas;

    const getFirma = (concepto: string) => {
        return firmasToUse.find(f => f.concepto === concepto);
    };

    return (
        <Document>
            <Page size="A4" style={styles.page} wrap>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Image 
                        src="/images/LOGO-ITEA.png" 
                        style={{ width: 100, height: 50, objectFit: "contain" }}
                    />
                    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                        <Text style={[styles.header, { textAlign: 'center', fontSize: 10 }]}>INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS</Text>
                        <Text style={[styles.header, { textAlign: 'center', color: '#b91c1c', fontSize: 10 }]}>DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS</Text>
                        <Text style={[styles.header, { textAlign: 'center', color: '#b91c1c', fontSize: 10 }]}>OFICINA DE RECURSOS MATERIALES</Text>
                        <Text style={[styles.header, { textAlign: 'center', color: '#b91c1c', fontSize: 10 }]}>DOCUMENTO DE BAJA DE BIENES MUEBLES</Text>
                    </View>
                    <Image 
                        src="/images/INEA NACIONAL.png" 
                        style={{ width: 70, height: 30, objectFit: "contain" }}
                    />
                </View>

                <View style={styles.section}>
                    <Text><Text style={styles.label}>FOLIO DE RESGUARDO ORIGINAL: </Text> {data.folio_resguardo?.toUpperCase()}</Text>
                    <Text><Text style={styles.label}>FOLIO DE BAJA: </Text> {data.folio_baja?.toUpperCase()}</Text>
                    <Text><Text style={styles.label}>DIRECTOR: </Text> {data.director?.toUpperCase()}</Text>
                    <Text><Text style={styles.label}>ÁREA: </Text> {data.area?.toUpperCase()}</Text>
                    <Text><Text style={styles.label}>PUESTO: </Text> {data.puesto?.toUpperCase()}</Text>
                    <Text><Text style={styles.label}>FECHA DE BAJA: </Text> {data.fecha?.toUpperCase()}</Text>
                </View>
                {/* Renderizar INEA e ITEA una debajo de otra, permitiendo que ambas se partan entre páginas */}
                {[
                    { nombre: 'INEA', articulos: articulosINEA },
                    { nombre: 'ITEA', articulos: articulosITEA }
                ].map((grupo) => (
                    grupo.articulos.length > 0 && (
                        <View key={grupo.nombre}>
                            <Text style={{ fontWeight: 'bold', fontSize: 11, marginTop: 12, marginBottom: 2, color: '#b91c1c' }}>
                                ARTÍCULOS DE ORIGEN {grupo.nombre}
                            </Text>
                            <View style={styles.table}>
                                <View style={[styles.tableRow, styles.tableHeader]} fixed>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2.5, fontSize: 8 }]}>ID INVENTARIO</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 5.5, fontSize: 8 }]}>DESCRIPCIÓN</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.6, fontSize: 8 }]}>RUBRO</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: .7, fontSize: 8 }]}>ESTADO</Text>
                                    {showResguardanteColumn && (
                                        <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2.5, fontSize: 8 }]}>RESGUARDANTE</Text>
                                    )}
                                    {hasMultipleFolios && (
                                        <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2, fontSize: 8 }]}>FOLIO BAJA</Text>
                                    )}
                                </View>
                                {grupo.articulos.map((art: PdfArticulo, idx2: number) => (
                                    <View style={styles.tableRow} key={idx2}>
                                        <Text style={{ ...styles.tableCell, flex: 2.5 }}>{art.id_inv?.toUpperCase()}</Text>
                                        <Text style={{ ...styles.tableCell, flex: 5.5 }}>{art.descripcion?.toUpperCase()}</Text>
                                        <Text style={{ ...styles.tableCell, flex: 1.6 }}>{art.rubro?.toUpperCase()}</Text>
                                        <Text style={{ ...styles.tableCell, flex: .7 }}>{art.estado?.toUpperCase()}</Text>
                                        {showResguardanteColumn && (
                                            <Text style={{ ...styles.tableCell, flex: 2.5 }}>{(art.resguardante || data.resguardante)?.toUpperCase()}</Text>
                                        )}
                                        {hasMultipleFolios && (
                                            <Text style={{ ...styles.tableCell, flex: 2 }}>{(art.folio_baja || data.folio_baja)?.toUpperCase()}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )
                ))}
                {/* Firmas y paginación solo al pie de la última página */}
                <View style={styles.footer}>
                    <View style={styles.signature}>
                        <View style={styles.signatureBox}>
                            <Text style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 2 }}>AUTORIZA</Text>
                            <Text>_______________________________</Text>
                            <Text style={{ marginTop: 2 }}>{getFirma('Autoriza')?.nombre?.toUpperCase() || ' '}</Text>
                            <Text style={{ fontSize: 7 }}>{getFirma('Autoriza')?.puesto?.toUpperCase() || 'DIRECTOR(A) ADMIN. Y FINANZAS'}</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 2 }}>CONOCIMIENTO</Text>
                            <Text>________________________________</Text>
                            <Text style={{ marginTop: 2 }}>{getFirma('Conocimiento')?.nombre?.toUpperCase() || ' '}</Text>
                            <Text style={{ fontSize: 7 }}>{getFirma('Conocimiento')?.puesto?.toUpperCase() || 'DIRECTOR(A) RECURSOS MATERIALES'}</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 2 }}>EX-RESPONSABLE</Text>
                            <Text>__________________________________</Text>
                            <Text style={{ marginTop: 2 }}>{data.director?.toUpperCase()}</Text>
                            <Text style={{ fontSize: 7 }}>{data.puesto?.toUpperCase()} DE {data.area?.toUpperCase()}</Text>
                        </View>
                    </View>
                    <Text
                        style={{
                            fontSize: 8,
                            textAlign: 'right',
                            marginTop: 10,
                        }}
                        render={({ pageNumber, totalPages }) =>
                            pageNumber === totalPages ? `PÁGINA ${pageNumber} DE ${totalPages}` : ''
                        }
                    />
                </View>
            </Page>
        </Document>
    );
};

const BajaPDFReport: React.FC = () => {
    return (
        <div className="w-full flex flex-col gap-2">
            {/* Previsualización del PDF si se requiere en el futuro */}
        </div>
    );
};

export default BajaPDFReport;
