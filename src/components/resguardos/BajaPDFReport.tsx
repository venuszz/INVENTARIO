import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface PdfArticulo {
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    estado: string | null;
    origen?: string | null; // INEA o ITEA
    folio_baja?: string | null; // Añadimos el folio_baja opcional
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
}

interface BajaPDFReportProps {
    data: PdfDataBaja;
    onClose: () => void;
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
});

export const BajaPDF = ({ data }: { data: PdfDataBaja }) => {
    // Separar artículos por origen
    const articulosINEA = data.articulos.filter(a => a.origen === 'INEA');
    const articulosITEA = data.articulos.filter(a => a.origen === 'ITEA');
    const hasOrigen = data.articulos.some(a => a.origen);
    const grupos = hasOrigen
        ? [
            { nombre: 'INEA', articulos: articulosINEA },
            { nombre: 'ITEA', articulos: articulosITEA }
        ]
        : [
            { nombre: '', articulos: data.articulos }
        ];

    // Verificar si hay diferentes folios de baja
    const hasMultipleFolios = data.articulos.some(a => a.folio_baja && a.folio_baja !== data.folio_baja);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Image src="/images/LOGO-ITEA.png" style={{ width: 100, height: 50, objectFit: "contain" }} />
                    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                        <Text style={[styles.header, { textAlign: 'center' }]}>INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS</Text>
                        <Text style={[styles.header, { textAlign: 'center', color: '#b91c1c' }]}>DOCUMENTO DE BAJA DE BIENES MUEBLES</Text>
                        <Text style={{ fontSize: 10, color: '#991b1b', textAlign: 'center', marginBottom: 2 }}>Este documento certifica la baja de un resguardo de los siguientes bienes del instituto</Text>
                    </View>
                    <Image src="/images/INEA NACIONAL.png" style={{ width: 70, height: 30, objectFit: "contain" }} />
                </View>

                <View style={styles.section}>
                    <Text><Text style={styles.label}>Folio de Resguardo Original: </Text> {data.folio_resguardo}</Text>
                    <Text><Text style={styles.label}>Folio de Baja: </Text> {data.folio_baja}</Text>
                    <Text><Text style={styles.label}>Director:</Text> {data.director}</Text>
                    <Text><Text style={styles.label}>Área: </Text> {data.area}</Text>
                    <Text><Text style={styles.label}>Puesto: </Text> {data.puesto}</Text>
                    <Text><Text style={styles.label}>Fecha de Baja: </Text> {data.fecha}</Text>
                    <Text><Text style={styles.label}>Resguardante:</Text> {data.resguardante}</Text>
                </View>
                {grupos.map((grupo) => (
                    grupo.articulos.length > 0 && (
                        <View key={grupo.nombre} wrap={false}>
                            {grupo.nombre && (
                                <Text style={{ fontWeight: 'bold', fontSize: 11, marginTop: 12, marginBottom: 2, color: '#b91c1c' }}>
                                    Artículos de origen {grupo.nombre}
                                </Text>
                            )}
                            <View style={styles.table}>
                                <View style={[styles.tableRow, styles.tableHeader]}>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2.5 }]}>ID Inventario</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 5.5 }]}>Descripción</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.6 }]}>Rubro</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: .7 }]}>Estado</Text>
                                    {hasMultipleFolios && (
                                        <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2 }]}>Folio Baja</Text>
                                    )}
                                </View>
                                {grupo.articulos.map((art: PdfArticulo, idx2: number) => (
                                    <View style={styles.tableRow} key={idx2}>
                                        <Text style={{ ...styles.tableCell, flex: 2.5 }}>{art.id_inv}</Text>
                                        <Text style={{ ...styles.tableCell, flex: 5.5 }}>{art.descripcion}</Text>
                                        <Text style={{ ...styles.tableCell, flex: 1.6 }}>{art.rubro}</Text>
                                        <Text style={{ ...styles.tableCell, flex: .7 }}>{art.estado}</Text>
                                        {hasMultipleFolios && (
                                            <Text style={{ ...styles.tableCell, flex: 2 }}>{art.folio_baja || data.folio_baja}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )
                ))}
                <View style={{ position: 'absolute', bottom: 20, left: 25, right: 25 }}>
                    <View style={styles.signature}>
                        <View style={styles.signatureBox}>
                            <Text>         AUTORIZA</Text>
                            <Text> </Text>
                            <Text> </Text>
                            <Text> </Text>
                            <Text>_______________________________</Text>
                            <Text> </Text>
                            <Text> DIRECTOR(A) ADMIN. Y FINANZAS</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text>       CONOCIMIENTO</Text>
                            <Text> </Text>
                            <Text> </Text>
                            <Text> </Text>
                            <Text>________________________________</Text>
                            <Text> </Text>
                            <Text> DIRECTOR(A) RECURSOS MATERIALES</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text>           EX-RESGUARDANTE</Text>
                            <Text> </Text>
                            <Text> </Text>
                            <Text> </Text>
                            <Text>__________________________________</Text>
                            <Text><Text style={styles.label}></Text> {data.director}</Text>
                            <Text><Text style={styles.label}></Text> {data.puesto}</Text>
                        </View>
                    </View>
                    <Text
                        style={{
                            fontSize: 8,
                            textAlign: 'right',
                            marginTop: 10,
                        }}
                        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    );
};

const BajaPDFReport: React.FC<BajaPDFReportProps> = ({ data }) => {
    return (
        <div style={{ width: '100%' }}>
            <PDFDownloadLink
                document={<BajaPDF data={data} />}
                fileName={`baja_${data.folio_baja}.pdf`}
                style={{ display: 'none' }}
            >
                {() => null}
            </PDFDownloadLink>
        </div>
    );
};

export default BajaPDFReport;
