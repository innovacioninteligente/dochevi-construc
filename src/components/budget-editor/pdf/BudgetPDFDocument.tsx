import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { EditableBudgetLineItem } from '@/types/budget-editor';
import { BudgetCostBreakdown } from '@/backend/budget/domain/budget';
import { formatMoneyEUR } from '@/lib/utils';

// Helper to format currency for PDF precisely without DOM locale issues
const formatCurrencyPDF = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '0,00 €';

    // Convert to 2 decimal places string
    const parts = amount.toFixed(2).split('.');

    // Add thousand separators manually
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decimalPart = parts[1];

    return `${integerPart},${decimalPart} €`;
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 40,
        paddingBottom: 60,
        paddingHorizontal: 40,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#1a1a1a',
    },
    headerSpace: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 10,
        color: '#444',
        marginTop: 4,
    },
    chapterBlock: {
        marginTop: 15,
        marginBottom: 10,
    },
    chapterTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        backgroundColor: '#f5f5f5',
        padding: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 4,
        paddingTop: 4,
        marginTop: 4,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        paddingTop: 8,
        paddingBottom: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eeeeee',
    },
    colNum: { width: '8%', textAlign: 'left' },
    colUd: { width: '6%', textAlign: 'center' },
    colDesc: { width: '50%', textAlign: 'left', paddingRight: 10 },
    colQuantity: { width: '12%', textAlign: 'right' },
    colPrice: { width: '12%', textAlign: 'right' },
    colTotal: { width: '12%', textAlign: 'right' },

    // Sub-tables
    subTable: {
        marginTop: 4,
        borderTopWidth: 0.5,
        borderTopColor: '#aaa',
        paddingTop: 4,
    },
    subTableRow: {
        flexDirection: 'row',
        paddingVertical: 2,
        fontSize: 7,
        color: '#555',
    },
    subColDesc: { width: '64%' },
    subColRend: { width: '12%', textAlign: 'right' },
    subColPrice: { width: '12%', textAlign: 'right' },
    subColTotal: { width: '12%', textAlign: 'right' },

    chapterTotal: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#000',
        fontWeight: 'bold',
        fontSize: 10,
    },
    summaryBlock: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: '#eee',
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 5,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
    },
    summaryRowBold: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        fontWeight: 'bold',
        marginTop: 4,
        borderTopWidth: 0.5,
        borderTopColor: '#ccc',
    },
    summaryGrandTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        fontWeight: 'bold',
        fontSize: 12,
        marginTop: 5,
        borderTopWidth: 1.5,
        borderTopColor: '#000',
    },
    pageNumber: {
        position: 'absolute',
        fontSize: 8,
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'grey',
    },
});

export interface BudgetPDFData {
    projectName: string;
    clientName: string;
    date: string;
    items: EditableBudgetLineItem[];
    chapters: string[];
    costBreakdown: BudgetCostBreakdown;
}

export const BudgetPDFDocument = ({ data }: { data: BudgetPDFData }) => {

    // Ensure accurate calculations at generation time
    const calculateChapterTotal = (chapterName: string) => {
        return data.items
            .filter(i => i.chapter === chapterName)
            .reduce((acc, curr) => acc + (curr.item?.totalPrice || 0), 0);
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerSpace} fixed>
                    <Text style={styles.title}>{data.projectName}</Text>
                    <Text style={styles.subtitle}>Proyecto / Cliente: {data.clientName}</Text>
                    <Text style={styles.subtitle}>Fecha: {data.date}</Text>
                    <Text style={styles.subtitle}>Documento: ESTADO DE MEDICIONES Y PRESUPUESTO</Text>
                </View>

                {/* Content */}
                {data.chapters.map((chapterName, idx) => {
                    const chapterItems = data.items.filter(i => i.chapter === chapterName);
                    if (chapterItems.length === 0) return null;
                    const chapTotal = calculateChapterTotal(chapterName);
                    const chapCode = `${(idx + 1).toString().padStart(2, '0')}`;

                    return (
                        <View key={chapterName} style={styles.chapterBlock}>
                            <Text style={styles.chapterTitle}>{chapCode} {chapterName}</Text>

                            <View style={styles.tableHeaderRow}>
                                <Text style={styles.colNum}>Nº</Text>
                                <Text style={styles.colUd}>Ud</Text>
                                <Text style={styles.colDesc}>Descripción</Text>
                                <Text style={styles.colQuantity}>Cantidad</Text>
                                <Text style={styles.colPrice}>Precio</Text>
                                <Text style={styles.colTotal}>Importe</Text>
                            </View>

                            {chapterItems.sort((a, b) => {
                                const codeA = a.item?.code || '';
                                const codeB = b.item?.code || '';
                                if (codeA && codeB) {
                                    return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
                                }
                                return (a.order || 0) - (b.order || 0);
                            }).map((item, itemIdx) => (
                                <View key={item.id} style={styles.tableRow}>
                                    <Text style={styles.colNum}>{item.item?.code || `${chapCode}.${itemIdx + 1}`}</Text>
                                    <Text style={styles.colUd}>{item.item?.unit || '-'}</Text>

                                    <View style={styles.colDesc}>
                                        <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>{item.originalTask}</Text>

                                        {/* Only show item description if it's different from the bolded original task title */}
                                        {item.item?.description && item.item.description !== item.originalTask && (
                                            <Text style={{ fontSize: 8, color: '#444' }}>{item.item.description}</Text>
                                        )}

                                        {/* Optional Decomposition details specifically requested to look professional */}
                                        {item.item?.breakdown && item.item.breakdown.length > 0 && (
                                            <View style={styles.subTable}>
                                                <View style={styles.subTableRow}>
                                                    <Text style={styles.subColDesc}>Descompuesto</Text>
                                                    <Text style={styles.subColRend}>Rendimiento</Text>
                                                    <Text style={styles.subColPrice}>Precio Unit.</Text>
                                                    <Text style={styles.subColTotal}>Parcial</Text>
                                                </View>
                                                {item.item.breakdown.map((b, bIdx) => {
                                                    const finalYield = b.quantity || b.yield || 1;
                                                    const total = b.total || (b.price * finalYield);
                                                    return (
                                                        <View key={bIdx} style={styles.subTableRow}>
                                                            <Text style={styles.subColDesc}>{b.description || b.concept || '-'}</Text>
                                                            <Text style={styles.subColRend}>{finalYield.toFixed(3)}</Text>
                                                            <Text style={styles.subColPrice}>{formatCurrencyPDF(b.price)}</Text>
                                                            <Text style={styles.subColTotal}>{formatCurrencyPDF(total)}</Text>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        )}
                                    </View>

                                    <Text style={styles.colQuantity}>{(item.item?.quantity || 1).toFixed(2).replace('.', ',')}</Text>
                                    <Text style={styles.colPrice}>{formatCurrencyPDF(item.item?.unitPrice || 0)}</Text>
                                    <Text style={styles.colTotal}>{formatCurrencyPDF(item.item?.totalPrice || 0)}</Text>
                                </View>
                            ))}

                            <View style={styles.chapterTotal}>
                                <Text>Total {chapterName}: {formatCurrencyPDF(chapTotal)}</Text>
                            </View>
                        </View>
                    );
                })}

                {/* Final Economic Summary */}
                <View style={styles.summaryBlock} wrap={false}>
                    <Text style={styles.summaryTitle}>RESUMEN ECONÓMICO</Text>

                    <View style={styles.summaryRow}>
                        <Text>PRESUPUESTO DE EJECUCIÓN MATERIAL (PEM)</Text>
                        <Text>{formatCurrencyPDF(data.costBreakdown.materialExecutionPrice)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text>Gastos Generales (13,00%)</Text>
                        <Text>{formatCurrencyPDF(data.costBreakdown.overheadExpenses)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text>Beneficio Industrial (6,00%)</Text>
                        <Text>{formatCurrencyPDF(data.costBreakdown.industrialBenefit)}</Text>
                    </View>

                    <View style={styles.summaryRowBold}>
                        <Text>BASE IMPONIBLE</Text>
                        <Text>{formatCurrencyPDF(data.costBreakdown.materialExecutionPrice + data.costBreakdown.overheadExpenses + data.costBreakdown.industrialBenefit)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text>I.V.A. (21,00%)</Text>
                        <Text>{formatCurrencyPDF(data.costBreakdown.tax)}</Text>
                    </View>

                    <View style={styles.summaryGrandTotal}>
                        <Text>TOTAL PRESUPUESTO CONTRATA</Text>
                        <Text>{formatCurrencyPDF(data.costBreakdown.total)}</Text>
                    </View>
                </View>

                {/* Page Numerator */}
                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                    `Página ${pageNumber} de ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
};
