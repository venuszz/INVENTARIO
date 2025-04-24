import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface PdfArticulo {
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    estado: string | null;
    origen?: string | null; // INEA o ITEA
}

interface PdfFirma {
    concepto: string;
    nombre: string;
    puesto: string;
}

interface PdfData {
    folio: string;
    fecha: string;
    director: string | undefined;
    area: string;
    puesto: string;
    resguardante: string;
    articulos: PdfArticulo[];
    firmas?: PdfFirma[];
    usufinal?: string;
    usufinalPuesto?: string;
}

interface ResguardoPDFReportProps {
    data: PdfData;
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
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
        color: '#1e293b',
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
        backgroundColor: '#e0e7ef',
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
        backgroundColor: '#e0e7ef',
        textAlign: 'center',
        fontSize: 10,
    },
    signature: {
        marginTop: 12,
        flexDirection: 'row',
        //justifyContent: 'space-between',
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

export const ResguardoPDF = ({ data }: { data: PdfData }) => {
    // Separar artículos por origen
    const articulosINEA = data.articulos.filter(a => a.origen === 'INEA');
    const articulosITEA = data.articulos.filter(a => a.origen === 'ITEA');
    // Si no tienen campo origen, intentar deducirlo (compatibilidad)
    const hasOrigen = data.articulos.some(a => a.origen);
    const grupos = hasOrigen
        ? [
            { nombre: 'INEA', articulos: articulosINEA },
            { nombre: 'ITEA', articulos: articulosITEA }
        ]
        : [
            { nombre: '', articulos: data.articulos }
        ];

    // Si data.firmas está vacío, crear firmas por defecto
    const defaultFirmas: PdfFirma[] = [
        {
            concepto: 'AUTORIZA',
            nombre: 'Por asignar',
            puesto: 'DIRECTOR(A) ADMIN. Y FINANZAS'
        },
        {
            concepto: 'CONOCIMIENTO',
            nombre: 'Por asignar',
            puesto: 'DIRECTOR(A) RECURSOS MATERIALES'
        },
        {
            concepto: 'RESPONSABLE',
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
            <Page size="A4" style={styles.page}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Image src="/images/LOGO-ITEA.png" style={{ width: 100, height: 50, objectFit: "contain" }} />
                    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                        <Text style={[styles.header, { textAlign: 'center' }]}>INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS</Text>
                        <Text style={[styles.header, { textAlign: 'center' }]}>DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS</Text>
                        <Text style={[styles.header, { textAlign: 'center' }]}>OFICINA DE RECURSOS MATERIALES</Text>
                        <Text style={[styles.header, { textAlign: 'center' }]}>RESGUARDO DE BIENES MUEBLES</Text>
                    </View>
                    <Image src="/images/INEA NACIONAL.png" style={{ width: 70, height: 30, objectFit: "contain" }} />
                </View>

                <View style={styles.section}>
                    <Text><Text style={styles.label}>FOLIO: </Text> {data.folio}</Text>
                    <Text><Text style={styles.label}>DIRECTOR: </Text> {data.director}</Text>
                    <Text><Text style={styles.label}>ÁREA: </Text> {data.area}</Text>
                    <Text><Text style={styles.label}>PUESTO: </Text> {data.puesto}</Text>
                    <Text><Text style={styles.label}>FECHA: </Text> {data.fecha}</Text>
                    <Text><Text style={styles.label}>RESGUARDANTE: </Text> {data.resguardante}</Text>
                </View>
                {grupos.map((grupo) => (
                    grupo.articulos.length > 0 && (
                        <View key={grupo.nombre} wrap={false}>
                            {grupo.nombre && (
                                <Text style={{ fontWeight: 'bold', fontSize: 11, marginTop: 12, marginBottom: 2 }}>
                                    ARTÍCULOS DE ORIGEN {grupo.nombre}
                                </Text>
                            )}
                            <View style={styles.table}>
                                <View style={[styles.tableRow, styles.tableHeader]}>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2.5 }]}>ID INVENTARIO</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 5.5 }]}>DESCRIPCIÓN</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.6 }]}>RUBRO</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: .7 }]}>ESTADO</Text>
                                </View>
                                {grupo.articulos.map((art: PdfArticulo, idx2: number) => (
                                    <View style={styles.tableRow} key={idx2}>
                                        <Text style={{ ...styles.tableCell, flex: 2.5 }}>{art.id_inv}</Text>
                                        <Text style={{ ...styles.tableCell, flex: 5.5 }}>{art.descripcion}</Text>
                                        <Text style={{ ...styles.tableCell, flex: 1.6 }}>{art.rubro}</Text>
                                        <Text style={{ ...styles.tableCell, flex: .7 }}>{art.estado}</Text>
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
                            <Text>{getFirma('AUTORIZA')?.nombre || ' '}</Text>
                            <Text>{getFirma('AUTORIZA')?.puesto || 'DIRECTOR(A) ADMIN. Y FINANZAS'}</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text>       CONOCIMIENTO</Text>
                            <Text> </Text>
                            <Text> </Text>
                            <Text> </Text>
                            <Text>________________________________</Text>
                            <Text> </Text>
                            <Text>{getFirma('CONOCIMIENTO')?.nombre || ' '}</Text>
                            <Text>{getFirma('CONOCIMIENTO')?.puesto || 'DIRECTOR(A) RECURSOS MATERIALES'}</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text>RESGUARDANTE</Text>
                            <Text> </Text>
                            <Text> </Text>
                            <Text> </Text>
                            <Text>__________________________________</Text>
                            <Text> </Text>
                            <Text>{data.director}</Text>
                            <Text>{data.puesto} DE {data.area}</Text>
                        </View>
                    </View>
                    <Text
                        style={{
                            fontSize: 8,
                            textAlign: 'right',
                            marginTop: 10,
                        }}
                        render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    );
};

const ResguardoPDFReport: React.FC<ResguardoPDFReportProps> = ({ data }) => {
    return (
        <div style={{ width: '100%' }}>
            <PDFDownloadLink
                document={<ResguardoPDF data={data} />}
                fileName={`resguardo_${data.folio}.pdf`}
                style={{ display: 'none' }}
            >
                {() => null}
            </PDFDownloadLink>
        </div>
    );
};

export default ResguardoPDFReport;
