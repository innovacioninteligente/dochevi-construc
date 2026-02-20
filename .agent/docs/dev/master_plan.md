# 🏗️ Plan Maestro de Implementación — Dochevi Construc

> **Última actualización:** 2026-02-13
>
> Este documento define la hoja de ruta para transformar la plataforma de generación de presupuestos en un sistema integral de Gestión de Construcción (ERP ligero).

---

## 🎯 Objetivo General

Conectar la fase de venta (**Presupuesto**) con la realidad de la ejecución (**Obra**), permitiendo el control financiero en tiempo real mediante la ingesta de facturas y analítica comparativa.

---

## 🏛️ Arquitectura y Decisiones Técnicas

### 1. Ingesta del Catálogo de Precios (Servidor Externo)

> [!IMPORTANT]
> **Decisión (Feb 2026):** El procesamiento, extracción y creación del JSON del catálogo de precios se ha delegado a un **servidor externo**. Este servidor entregará un JSON estructurado con los ítems del catálogo, listo para ser persistido en BBDD y vectorizado.

**Impacto:**
- Se eliminan los procesos de parsing de PDF locales (Gemini, Regex, LLM parsers).
- Se simplifica el flujo de ingesta: `JSON externo → Persistencia Firestore → Vectorización`.
- Permite escalar la plataforma sin depender de procesamiento pesado en el cliente/servidor Node.js.

**Archivos candidatos a refactorizar/eliminar** (cuando llegue el JSON):

| Módulo | Archivos | Acción |
|--------|----------|--------|
| **Parsers PDF** | `gemini-price-book-parser.ts`, `llm-price-book-parser.ts`, `regex-price-book-parser.ts` | 🗑️ Eliminar |
| **Ingesta actual** | `ingest-price-book-service.ts`, `ingest-catalog-service.ts` | ♻️ Refactorizar (simplificar a carga desde JSON) |
| **Scripts debug** | `analyze-pdf-structure.ts`, `analyze-pdf.ts`, `debug-price-book.ts`, `analyze-prices.ts`, `test-gemini-25-pdf.ts` | 🗑️ Eliminar |
| **Scripts ingesta** | `run-real-ingestion.ts`, `test-ingestion-v2.ts`, `check-catalog-gaps.ts`, `deep-cleanup-catalog.ts` | 🗑️ Eliminar |
| **Genkit ingestion** | `src/genkit/ingestion.ts` | ♻️ Refactorizar |
| **UI ingesta PDF** | `ingestion-dashboard.tsx`, `price-book-uploader.tsx` | ♻️ Refactorizar (upload JSON en vez de PDF) |
| **Actions ingesta** | `ingest-catalog.action.ts`, `ingest-price-book.action.ts` | ♻️ Refactorizar |

**Archivos que SE MANTIENEN:**
- `price-book-item.ts` (entidad de dominio)
- `firestore-price-book-repository.ts` (persistencia)
- `vectorize-price-book.use-case.ts` (vectorización)
- `search-price-book-service.ts`, `semantic-search.use-case.ts` (búsqueda)
- `material-catalog-search.tsx` (UI de búsqueda en presupuesto)
- `price-book-retriever.tool.ts` (tool del agente AI)

### 2. Base de Datos

| Servicio | Uso |
|----------|-----|
| **Firestore** | Base de datos principal (Obras, Facturas, Usuarios, Catálogo) |
| **Vector Search** | Búsqueda semántica del catálogo de materiales |
| **Cloud Storage** | PDFs originales (Facturas, Planos) |

### 3. Stack Tecnológico

- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Backend:** Server Actions + Genkit (AI flows)
- **AI:** Google Gemini (Flash 2.0)
- **Infra:** Firebase (Firestore, Auth, Storage, Hosting)

---

## 📅 Fases de Implementación

### Fase 1: Catálogo de Materiales (Obramat) ⏳ En progreso

**Objetivo:** Base de datos de productos reales con precios actuales para presupuestos y carga de gastos.

| Tarea | Estado | Notas |
|-------|--------|-------|
| Diseño entidad `MaterialCatalogItem` (SKU, Descripción, Precio, Categoría, Embedding) | ✅ Hecho | `price-book-item.ts` |
| Repositorio Firestore + Vector Search | ✅ Hecho | `firestore-price-book-repository.ts` |
| Servicio de búsqueda semántica | ✅ Hecho | `search-price-book-service.ts` |
| Vectorización de ítems | ✅ Hecho | `vectorize-price-book.use-case.ts` |
| Buscador integrado en presupuesto | ✅ Hecho | `material-catalog-search.tsx` |
| **Ingesta desde JSON externo** | ⏳ Bloqueada | Esperando JSON del servidor externo |
| Refactorizar ingesta (eliminar parsers PDF) | ⏳ Bloqueada | Depende del punto anterior |
| Limpieza de archivos obsoletos | ⏳ Bloqueada | Post-refactorización |

---

### Fase 2: Módulo de Obras (Gestión de Proyectos) 🟡 No iniciada

**Objetivo:** Gestionar el ciclo de vida de una obra desde que se aprueba el presupuesto.

| Tarea | Estado | Paralelizable |
|-------|--------|---------------|
| Diseño entidad `Project` (Obra) | ⬚ Pendiente | ✅ **Sí** |
| Estados: `preparacion → ejecucion → pausada → finalizada → cerrada` | ⬚ Pendiente | ✅ **Sí** |
| Vinculación 1:1 con `Budget` | ⬚ Pendiente | ✅ **Sí** |
| Repositorio Firestore `Project` | ⬚ Pendiente | ✅ **Sí** |
| Gestión de Fases y Hitos (Timeline por capítulos) | ⬚ Pendiente | ✅ **Sí** |
| Gestión de Personal (asignación de trabajadores/subcontratas) | ⬚ Pendiente | ✅ **Sí** |
| Documentación por obra (Planos, Licencias, Fotos) | ⬚ Pendiente | ✅ **Sí** |
| UI "Mis Obras": Convertir presupuesto aprobado → Obra | ⬚ Pendiente | ✅ **Sí** |

---

### Fase 3: Sistema de Gastos y Facturas 🟡 No iniciada

**Objetivo:** Controlar el coste real de la obra mediante digitalización de facturas.

| Tarea | Estado | Paralelizable |
|-------|--------|---------------|
| Diseño entidad `Expense` / `Invoice` | ⬚ Pendiente | ✅ **Sí** |
| Entidad `Provider` (alimentada automáticamente) | ⬚ Pendiente | ✅ **Sí** |
| Repositorio Firestore `Expense` | ⬚ Pendiente | ✅ **Sí** |
| Motor AI de ingesta de facturas (upload PDF → extracción) | ⬚ Pendiente | ⚠️ Parcial (dominio sí, AI depende del modelo) |
| Auto-categorización (sugerir capítulo del presupuesto) | ⬚ Pendiente | ⚠️ Parcial |
| UI "Inbox de Facturas" (revisar y aprobar gastos) | ⬚ Pendiente | ✅ **Sí** |

---

### Fase 4: Analíticas Financieras 🟡 No iniciada

**Objetivo:** Visibilidad financiera en tiempo real (Teórico vs Real).

| Tarea | Estado | Paralelizable |
|-------|--------|---------------|
| Dashboard por Obra: Burn Rate, Coste Estimado vs Real, Margen Bruto | ⬚ Pendiente | ⚠️ Requiere Fase 2 + 3 |
| Dashboard Global: Facturación, Gastos, Beneficio neto, IVA | ⬚ Pendiente | ⚠️ Requiere Fase 2 + 3 |

---

### Fase 5: Optimización y Escalamiento 🟡 No iniciada

**Objetivo:** Asegurar que el sistema aguante carga masiva.

| Tarea | Estado | Paralelizable |
|-------|--------|---------------|
| Colas de procesamiento (Cloud Tasks) | ⬚ Pendiente | ✅ **Sí** (diseño) |
| Desacoplar UI del procesamiento | ⬚ Pendiente | ✅ **Sí** |
| Tests de carga con documentos grandes | ⬚ Pendiente | ⚠️ Requiere datos reales |

---

## 🚀 Tareas Paralelizables (Mientras Esperamos el JSON)

> Estas tareas pueden desarrollarse **ahora mismo**, sin depender del JSON del catálogo:

### Prioridad Alta — Fase 2: Módulo de Obras

1. **Diseñar entidades de dominio** (`Project`, `ProjectPhase`, `ProjectMilestone`, `Worker`)
2. **Crear repositorio Firestore** para `Project`
3. **Crear Server Actions** para CRUD de obras
4. **UI "Mis Obras"**: Lista de obras del usuario + creación desde presupuesto aprobado
5. **Máquina de estados** para el ciclo de vida de la obra

### Prioridad Alta — Fase 3: Diseño de Dominio

1. **Diseñar entidades** (`Expense`, `Invoice`, `InvoiceLine`, `Provider`)
2. **Crear repositorio Firestore** para `Expense` y `Provider`
3. **UI "Inbox de Facturas"**: Diseño de la interfaz de validación

### Prioridad Media — Mejoras Transversales

1. **Refactorizar la UI del dashboard** de administración (actualmente solo tiene precios)
2. **Diseñar navegación lateral** del dashboard para integrar: Obras, Facturas, Analíticas
3. **Sistema de notificaciones** (alertas de desviación de presupuesto)

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| La extracción AI de facturas complejas puede fallar | Mantener siempre validación humana ("Human-in-the-loop") |
| El catálogo de Obramat cambia formatos | Delegado al servidor externo (desacoplado de la plataforma) |
| Complejidad del módulo de Obras | Implementar MVP primero (solo estados + vinculación a presupuesto) |
| Escalabilidad del procesamiento | Cloud Tasks + procesamiento asíncrono |