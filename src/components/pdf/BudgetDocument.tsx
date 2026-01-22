'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333333'
    },
    header: {
        marginBottom: 20,
        paddingBottom: 20,
        borderBottom: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    logoSection: {
        width: '40%'
    },
    companyLogo: {
        width: 150,
        height: 'auto',
        marginBottom: 10,
        objectFit: 'contain'
    },
    metaSection: {
        textAlign: 'right',
        fontSize: 9,
        color: '#64748B'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 5,
        textTransform: 'uppercase'
    },
    subtitle: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20,
        color: '#0F172A',
        borderBottom: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 5
    },
    textBlock: {
        marginBottom: 10,
        lineHeight: 1.5,
        fontSize: 9,
        textAlign: 'justify'
    },
    bold: {
        fontWeight: 'bold',
        color: '#0F172A'
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderColor: '#E2E8F0',
        marginTop: 10,
        marginBottom: 20
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row'
    },
    tableCol: {
        width: '15%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#E2E8F0',
        padding: 5
    },
    tableColDesc: {
        width: '40%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#E2E8F0',
        padding: 5
    },
    tableHeader: {
        backgroundColor: '#F1F5F9',
        fontWeight: 'bold',
        fontSize: 8,
        color: '#475569'
    },
    totalSection: {
        marginTop: 20,
        paddingTop: 10,
        borderTop: 2,
        borderColor: '#CBD5E1',
        alignItems: 'flex-end'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '40%',
        marginBottom: 5
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748B'
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0F172A'
    },
    finalTotal: {
        fontSize: 16,
        color: '#B45309', // Amber-700
        fontWeight: 'bold',
        marginTop: 5
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 8,
        borderTop: 1,
        borderColor: '#E2E8F0',
        paddingTop: 10
    },
    listBullet: {
        width: 10,
        fontSize: 10,
    }
});

interface BudgetDocumentProps {
    budgetNumber: string;
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    items: any[];
    costBreakdown: any;
    date: string;
}

export const BudgetDocument = ({
    budgetNumber,
    clientName,
    clientEmail,
    clientAddress,
    items,
    costBreakdown,
    date
}: BudgetDocumentProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoSection}>
                    <Image
                        src="/images/logo-express-renovation.webp"
                        style={styles.companyLogo}
                    />
                </View>
                <View style={styles.metaSection}>
                    <Text>DOCHEVI CONSTRUCCION Y REFORMAS SL</Text>
                    <Text>CIF: B75257238</Text>
                    <Text>C/ Ramón de Montcada 37, Calviá</Text>
                    <Text>www.expressrenovationmallorca.com</Text>
                    <Text>Tlf: 697 26 22 21</Text>
                </View>
            </View>

            <Text style={styles.title}>PRESUPUESTO Nº {budgetNumber}</Text>
            <Text style={styles.subtitle}>Fecha de emisión: {date}</Text>

            {/* Client Info */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 4 }}>
                <View>
                    <Text style={{ fontSize: 8, color: '#64748B', marginBottom: 4 }}>FACTURAR A</Text>
                    <Text style={styles.bold}>{clientName}</Text>
                    <Text>{clientEmail}</Text>
                    <Text>{clientAddress || 'Dirección no facilitada'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 8, color: '#64748B', marginBottom: 4 }}>VALIDEZ</Text>
                    <Text>15 Días</Text>
                </View>
            </View>

            {/* Items Table */}
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <View style={styles.tableCol}><Text>CÓDIGO</Text></View>
                    <View style={styles.tableColDesc}><Text>CONCEPTO</Text></View>
                    <View style={styles.tableCol}><Text>P. UNIT</Text></View>
                    <View style={styles.tableCol}><Text>CANTIDAD</Text></View>
                    <View style={styles.tableCol}><Text>TOTAL</Text></View>
                </View>
                {items.map((item, index) => (
                    <View style={styles.tableRow} key={index}>
                        <View style={styles.tableCol}><Text>{item.item?.code || `ITEM-${index}`}</Text></View>
                        <View style={styles.tableColDesc}>
                            <Text style={styles.bold}>{item.originalTask}</Text>
                            <Text style={{ fontSize: 8, color: '#64748B', marginTop: 2 }}>{item.item?.description}</Text>
                        </View>
                        <View style={styles.tableCol}><Text>{(item.item?.unitPrice || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text></View>
                        <View style={styles.tableCol}><Text>{item.item?.quantity || 1} {item.item?.unit}</Text></View>
                        <View style={styles.tableCol}><Text>{(item.item?.totalPrice || item.item?.price || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text></View>
                    </View>
                ))}
            </View>

            {/* Summary */}
            <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Base Imponible (PEM):</Text>
                    <Text style={styles.totalValue}>{costBreakdown.materialExecutionPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Gastos Generales:</Text>
                    <Text style={styles.totalValue}>{costBreakdown.overheadExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text>
                </View>
                {/* Beneficio Industrial HIDDEN */}

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>IVA:</Text>
                    <Text style={styles.totalValue}>{costBreakdown.tax.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text>
                </View>
                <Text style={styles.finalTotal}>TOTAL: {costBreakdown.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</Text>
            </View>

            <Text style={styles.footer}>
                DOCHEVI CONSTRUCCION Y REFORMAS SL - B75257238 - Calviá, Mallorca.
                Página 1
            </Text>
        </Page>

        {/* --- PAGE 2: METHOLODOGY & TERMS --- */}
        <Page size="A4" style={styles.page}>
            {/* Header Mini */}
            <View style={[styles.header, { paddingBottom: 10, marginBottom: 15 }]}>
                <Text style={{ fontSize: 10, color: '#B45309', fontWeight: 'bold' }}>DOCHEVI CONSTRUCCION Y REFORMAS</Text>
                <Text style={{ fontSize: 8, color: '#94A3B8' }}>Información Adicional al Presupuesto</Text>
            </View>

            <Text style={styles.sectionTitle}>CÓMO TRABAJAMOS Y BENEFICIOS</Text>

            <View style={{ marginBottom: 10 }}>
                <Text style={[styles.textBlock, styles.bold]}>1. Por qué es importante leer este presupuesto hasta el final</Text>
                <Text style={styles.textBlock}>
                    Independientemente de que finalmente trabajemos juntos o no, le recomendamos leer este presupuesto hasta el final.
                    La información que contiene le ayudará a comprender cómo debe desarrollarse un proceso de reforma bien organizado, seguro y de calidad, qué riesgos es importante evitar y cómo tomar una decisión informada al elegir a la empresa ejecutora.
                </Text>
                <Text style={styles.textBlock}>
                    Este documento no es solo un precio: describe nuestra forma de trabajar, el nivel de responsabilidad que asumimos y el valor real que recibe como cliente.
                </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
                <Text style={[styles.textBlock, styles.bold]}>2. Precio y Validez</Text>
                <Text style={styles.textBlock}>
                    El precio del presente presupuesto es: <Text style={styles.bold}>{costBreakdown.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</Text>.
                    Validez: <Text style={styles.bold}>15 días</Text>.
                    Trabajamos con planificación previa y con capacidad limitada. Una vez finalizado el plazo de validez, no podemos garantizar ni el precio ni las fechas de inicio y ejecución indicadas.
                </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
                <Text style={[styles.textBlock, styles.bold]}>3. Qué problemas resolvemos por usted</Text>
                <Text style={styles.textBlock}>
                    Como cliente, no debería: supervisar diariamente si los trabajos se están realizando correctamente, conocer materiales, técnicas o detalles constructivos, coordinar diferentes operarios o subcontratas, ni asumir riesgos derivados de una mala planificación.
                </Text>
                <Text style={styles.textBlock}>
                    En la práctica, la falta de organización, experiencia y control suele provocar: retrasos, sobrecostes, tensiones y resultados por debajo de lo esperado.
                    Nuestro trabajo consiste en asumir ese riesgo por usted y ofrecerle un proceso tranquilo, claro y previsible.
                </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
                <Text style={[styles.textBlock, styles.bold]}>4. Qué hacemos y qué beneficios obtiene usted</Text>

                <Text style={styles.textBlock}>✔ <Text style={styles.bold}>Experiencia contrastada y control real:</Text> Contamos con 25 años de experiencia práctica real en construcción y reformas. Dispongo de formación profesional en diseño de interiores, lo que me permite tener una visión global de cada proyecto.</Text>

                <Text style={styles.textBlock}>✔ <Text style={styles.bold}>Equipo propio, medios y estándares:</Text> Trabajamos con personal propio y formado, no con cuadrillas improvisadas. Todos cuentan con vestimenta profesional y equipos de protección. Disponemos de herramientas profesionales propias (precisión y velocidad).</Text>

                <Text style={styles.textBlock}>✔ <Text style={styles.bold}>Materiales de calidad:</Text> Utilizamos materiales contrastados que previenen problemas futuros, suponiendo un ahorro de tiempo, dinero y preocupaciones.</Text>

                <Text style={styles.textBlock}>✔ <Text style={styles.bold}>Pensamos como inversor y cliente:</Text> Entendemos perfectamente qué necesita un cliente y abordamos cada proyecto como si fuera para nosotros mismos.</Text>
            </View>

            <View style={{ marginBottom: 10 }}>
                <Text style={[styles.textBlock, styles.bold]}>5. Plazos e Inicio</Text>
                <Text style={styles.textBlock}>
                    No es posible comenzar antes debido a compromisos previamente planificados. Este sistema nos permite no asumir más proyectos de los que podemos ejecutar correctamente, cumplir plazos y mantener calidad constante.
                </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
                <Text style={[styles.textBlock, styles.bold]}>6. Preguntas Frecuentes</Text>
                <Text style={styles.textBlock}><Text style={styles.bold}>¿Por qué el precio es más alto que otras ofertas?</Text> Porque incluye organización integral, control profesional, 25 años de experiencia, equipo propio, materiales de calidad y responsabilidad real. Un precio más bajo casi siempre implica concesiones.</Text>
                <Text style={styles.textBlock}><Text style={styles.bold}>¿Tendré que supervisar la obra?</Text> No. Nuestro trabajo es que usted no tenga que involucrarse en cuestiones técnicas.</Text>
                <Text style={styles.textBlock}><Text style={styles.bold}>¿Qué ocurre después?</Text> Para nosotros, la relación no termina con la entrega. Habitualmente surgen recomendaciones y nuevas colaboraciones.</Text>
            </View>

            <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#B45309' }}>
                No buscamos clientes que elijan únicamente por precio.
                Trabajamos con clientes que valoran seguridad, calidad y profesionalidad.
            </Text>

            <Text style={styles.footer}>
                DOCHEVI CONSTRUCCION Y REFORMAS SL - B75257238
                Página 2
            </Text>
        </Page>
    </Document>
);
