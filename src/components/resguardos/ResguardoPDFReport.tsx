import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface PdfArticulo {
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    estado: string | null;
}

interface PdfData {
    folio: string;
    fecha: string;
    director: string | undefined;
    area: string;
    puesto: string;
    resguardante: string;
    articulos: PdfArticulo[];
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

export const ResguardoPDF = ({ data }: { data: PdfData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Image src="/images/LOGO-ITEA.png" style={{ width: 70, height: 30 }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.header}>INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS</Text>
                    <Text style={styles.header}>DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS</Text>
                    <Text style={styles.header}>OFICINA DE RECURSOS MATERIALES</Text>
                    <Text style={styles.header}>RESGUARDO DE BIENES MUEBLES</Text>
                </View>
                <Image src="/images/INEA NACIONAL.png" style={{ width: 70, height: 30 }} />
            </View>

            <View style={styles.section}>
                <Text><Text style={styles.label}>Folio:      </Text> {data.folio}</Text>
                <Text><Text style={styles.label}>Director:</Text> {data.director}</Text>
                <Text><Text style={styles.label}>Área:      </Text> {data.area}</Text>
                <Text><Text style={styles.label}>Puesto:  </Text> {data.puesto}</Text>
                <Text><Text style={styles.label}>Fecha:    </Text> {data.fecha}</Text>
                <Text><Text style={styles.label}>Resguardante:</Text> {data.resguardante}</Text>
            </View>
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2 }]}>ID Inventario</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 5.5 }]}>Descripción</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.5 }]}>Rubro</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>Estado</Text>
                </View>
                {data.articulos.map((art: PdfArticulo, idx: number) => (
                    <View style={styles.tableRow} key={idx}>
                        <Text style={{ ...styles.tableCell, flex: 2 }}>{art.id_inv}</Text>
                        <Text style={{ ...styles.tableCell, flex: 5.5 }}>{art.descripcion}</Text>
                        <Text style={{ ...styles.tableCell, flex: 1.5 }}>{art.rubro}</Text>
                        <Text style={{ ...styles.tableCell, flex: 1 }}>{art.estado}</Text>
                    </View>
                ))}
            </View>
            <View style={{ position: 'absolute', bottom: 10, left: 25, right: 25 }}>
                <View style={styles.signature}>
                    <View style={styles.signatureBox}>
                        <Text>         AUTORIZA</Text>
                        <Text> </Text>
                        <Text> </Text>
                        <Text> </Text>                       
                        <Text>_________________________</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text>       CONOCIMIENTO</Text>
                        <Text> </Text>
                        <Text> </Text>
                        <Text> </Text>                        
                        <Text>_________________________</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text>           RESGUARDANTE</Text>
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
                        fontSize: 6,
                        textAlign: 'right',
                        marginTop: 10,
                    }}
                    render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                />
            </View>
        </Page>
    </Document>
);

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
