import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface LevMueble {
    id: number;
    id_inv: string;
    descripcion: string | null;
    estado: string | null;
    estatus: string | null;
    area: string | null;
    usufinal: string | null;
    origen: 'INEA' | 'ITEA';
}

interface PdfFirma {
    concepto: string;
    nombre: string;
    puesto: string;
}

interface PdfData {
    fecha: string;
    articulos: LevMueble[];
    firmas?: PdfFirma[];
    filtros?: Record<string, string>;
}

const styles = StyleSheet.create({
    page: {
        fontSize: 10,
        padding: 25,
        paddingBottom: 70,
        backgroundColor: '#f8fafc',
        color: '#222',
        position: 'relative',
        size: 'A4',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
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
        flexGrow: 1,
    },
    tableRow: {
        flexDirection: 'row',
        minHeight: 25,
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
    tableCellIdContainer: {
        width: '15%', // Ancho fijo para la columna ID
        paddingVertical: 6,
        borderRightWidth: 1,
        borderRightColor: '#64748b',
        borderBottomWidth: 1,
        borderBottomColor: '#64748b',
        justifyContent: 'center',
    },
    tableCellIdText: {
        fontSize: 7,
        textAlign: 'center',
        wordBreak: 'break-word',
        paddingHorizontal: 2,
    },
    tableCellHeader: {
        fontWeight: 'bold',
        backgroundColor: '#e0e7ef',
        textAlign: 'center',
        fontSize: 10,
    },
    contentWrapper: {
        flexGrow: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 25,
        right: 25,
    },
    signature: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    signatureBox: {
        width: '40%',
        textAlign: 'center',
        fontSize: 7,
    },
    filterInfo: {
        marginTop: 10,
        marginBottom: 10,
        fontSize: 8,
        color: '#475569',
    },
    pageNumber: {
        fontSize: 8,
        textAlign: 'right',
        marginTop: 10,
    },
    logoITEA: {
        width: 100,
        height: 50,
        objectFit: "contain"
    },
    logoINEA: {
        width: 70,
        height: 30,
        objectFit: "contain"
    },
    spacer: {
        flexGrow: 1
    }
});

export const LevantamientoPDF = ({ data }: { data: PdfData }) => {
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
        }
    ];
    const firmasToUse = data.firmas?.length ? data.firmas.slice(0, 2) : defaultFirmas;

    const paginateArticles = () => {
        const ROWS_PER_PAGE = 20;
        const pages = [];

        for (let i = 0; i < data.articulos.length; i += ROWS_PER_PAGE) {
            pages.push(data.articulos.slice(i, i + ROWS_PER_PAGE));
        }

        if (pages.length === 0) {
            pages.push([]);
        }

        return pages;
    };

    const paginatedArticles = paginateArticles();
    const totalPages = paginatedArticles.length;

    return (
        <Document>
            {paginatedArticles.map((pageArticulos, page) => {
                const isFirstPage = page === 0;
                const isLastPage = page === totalPages - 1;
                const startIndex = page * 20;

                return (
                    <Page
                        key={page}
                        size="A4"
                        style={styles.page}
                        orientation="portrait"
                        wrap={false}
                    >
                        <View style={styles.contentWrapper}>
                            {isFirstPage && (
                                <>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Image src="/images/LOGO-ITEA.png" style={styles.logoITEA} />
                                        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                                            <Text style={styles.header}>INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS</Text>
                                            <Text style={styles.header}>DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS</Text>
                                            <Text style={styles.header}>OFICINA DE RECURSOS MATERIALES</Text>
                                            <Text style={styles.header}>REPORTE DE LEVANTAMIENTO DE INVENTARIO</Text>
                                        </View>
                                        <Image src="/images/INEA NACIONAL.png" style={styles.logoINEA} />
                                    </View>
                                    <View style={styles.section}>
                                        <Text><Text style={styles.label}>FECHA: </Text> {data.fecha?.toUpperCase()}</Text>
                                        <Text><Text style={styles.label}>TOTAL DE REGISTROS: </Text> {data.articulos.length}</Text>
                                        {data.filtros && Object.keys(data.filtros).length > 0 && (
                                            <View style={styles.filterInfo}>
                                                <Text style={styles.label}>FILTROS APLICADOS:</Text>
                                                {Object.entries(data.filtros).map(([key, value]) => (
                                                    value && <Text key={key}>{key.toUpperCase()}: {value.toUpperCase()}</Text>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </>
                            )}

                            <View style={styles.table}>
                                <View style={[styles.tableRow, styles.tableHeader]}>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { width: '5%' }]}>#</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { width: '15%' }]}>ID INVENTARIO</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { width: '30%' }]}>DESCRIPCIÓN</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { width: '10%' }]}>ESTADO</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { width: '10%' }]}>ESTATUS</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { width: '15%' }]}>ÁREA</Text>
                                    <Text style={[styles.tableCell, styles.tableCellHeader, { width: '15%' }]}>USUARIO FINAL</Text>
                                </View>

                                {pageArticulos.map((art, idx) => (
                                    <View style={styles.tableRow} key={idx}>
                                        <Text style={{ ...styles.tableCell, width: '5%' }}>{startIndex + idx + 1}</Text>
                                        <View style={styles.tableCellIdContainer}>
                                            <Text style={styles.tableCellIdText}>
                                                {art.id_inv?.toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={{ ...styles.tableCell, width: '30%' }}>{art.descripcion?.toUpperCase()}</Text>
                                        <Text style={{ ...styles.tableCell, width: '10%' }}>{art.estado?.toUpperCase()}</Text>
                                        <Text style={{ ...styles.tableCell, width: '10%' }}>{art.estatus?.toUpperCase()}</Text>
                                        <Text style={{ ...styles.tableCell, width: '15%' }}>{art.area?.toUpperCase()}</Text>
                                        <Text style={{ ...styles.tableCell, width: '15%' }}>{art.usufinal?.toUpperCase()}</Text>
                                    </View>
                                ))}
                            </View>

                            {pageArticulos.length < 10 && <View style={styles.spacer} />}
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.pageNumber}>
                                Página {page + 1} de {totalPages}
                            </Text>

                            {isLastPage && (
                                <View style={styles.signature}>
                                    {firmasToUse.map((firma, index) => (
                                        <View key={index} style={styles.signatureBox}>
                                            <Text>{firma.concepto.toUpperCase()}</Text>
                                            <Text>________________________________</Text>
                                            <Text>{firma.nombre?.toUpperCase()}</Text>
                                            <Text>{firma.puesto?.toUpperCase()}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </Page>
                );
            })}
        </Document>
    );
};

const LevantamientoPDFReport: React.FC<{ data: PdfData }> = ({ data }) => {
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    return (
        <div>
            <PDFDownloadLink
                document={<LevantamientoPDF data={data} />}
                fileName={`levantamiento_${new Date().toISOString().slice(0, 10)}.pdf`}
            >
                {({ loading }) => loading ? null : null}
            </PDFDownloadLink>
        </div>
    );
};

export default LevantamientoPDFReport;