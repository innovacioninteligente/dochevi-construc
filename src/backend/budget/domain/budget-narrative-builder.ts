import { DetailedFormValues } from "@/components/budget-request/schema";

export const buildBudgetNarrative = (data: DetailedFormValues): string => {
    const parts: string[] = [];

    // 1. Introducción y Definición del Proyecto
    const projectType = data.propertyType === 'residential' ? 'Vivienda' :
        data.propertyType === 'commercial' ? 'Local Comercial' : 'Oficina';
    const scope = data.projectScope === 'integral' ? 'reforma integral' : 'reforma parcial';

    parts.push(`El cliente solicita un presupuesto para una ${scope} de una ${projectType} de ${data.totalAreaM2} m².`);

    if (data.propertyType === 'residential') {
        if (data.numberOfRooms) parts.push(`Cuenta con ${data.numberOfRooms} habitaciones.`);
        if (data.numberOfBathrooms) parts.push(`Tiene ${data.numberOfBathrooms} baños.`);
    } else {
        if (data.workstations) parts.push(`Se prevén ${data.workstations} puestos de trabajo.`);
        if (data.meetingRooms) parts.push(`Con ${data.meetingRooms} salas de reuniones.`);
    }

    // 2. Demoliciones
    const demoParts: string[] = [];
    if (data.demolishPartitions) {
        demoParts.push(`demolición de tabiquería (${data.demolishPartitionsM2} m²) de tipo ${data.wallThickness === 'thick' ? 'grueso/carga' : 'simple'}`);
    }
    if (data.demolishFloorsM2) demoParts.push(`levantado de suelo (${data.demolishFloorsM2} m²)`);
    if (data.demolishWallTilesM2) demoParts.push(`picado de alicatados (${data.demolishWallTilesM2} m²)`);
    if (data.removeDoors) demoParts.push(`retirada de ${data.removeDoorsAmount} puertas`);

    if (demoParts.length > 0) {
        parts.push(`Trabajos de demolición requeridos: ${demoParts.join(', ')}.`);
        if (data.hasElevator) parts.push("El edificio dispone de ascensor para la retirada de escombros.");
        if (data.furnitureRemoval) parts.push("Se requiere servicio de retirada de mobiliario existente.");
    }

    // 3. Albañilería y Acabados (Suelos y Paredes)
    if (data.floorType) {
        parts.push(`Se instalará suelo de tipo ${data.floorType}.`);
        if (data.skirtingBoardLinearMeters) parts.push(`Con ${data.skirtingBoardLinearMeters} metros lineales de rodapié.`);
    }

    const paintParts: string[] = [];
    if (data.removeGotele) paintParts.push(`alisado de paredes (quitar gotelé) en ${data.removeGoteleM2} m²`);
    if (data.paintWalls) paintParts.push(`pintura de paredes (${data.paintWallsM2} m²)`);
    if (data.paintCeilings) paintParts.push(`pintura de techos (${data.paintCeilingsM2} m²)`);

    if (paintParts.length > 0) {
        parts.push(`Trabajos de pintura y revestimientos: ${paintParts.join(', ')}.`);
        if (data.paintType) parts.push(`Tipo de pintura preferida: ${data.paintType}.`);
    }

    // 4. Techos
    if (data.installFalseCeiling) {
        parts.push(`Instalación de falso techo en ${data.falseCeilingM2} m².`);
    }
    if (data.soundproofRoom) {
        parts.push(`Insonorización acústica requerida en ${data.soundproofRoomM2} m².`);
    }

    // 5. Carpintería
    const corpParts: string[] = [];
    if (data.renovateInteriorDoors) {
        corpParts.push(`instalación de ${data.interiorDoorsAmount} puertas interiores de ${data.doorsMaterial || 'estándar'}`);
    }
    if (data.installSlidingDoor) {
        corpParts.push(`instalación de ${data.slidingDoorAmount} puertas correderas`);
    }
    if (data.renovateExteriorCarpentry) {
        corpParts.push(`renovación de ${data.externalWindowsCount} ventanas exteriores`);
    }
    if (corpParts.length > 0) {
        parts.push(`Carpintería: ${corpParts.join(', ')}.`);
    }

    // 6. Instalaciones (Electricidad y Clima)
    if (data.elecScope) {
        parts.push(`Electricidad: Renovación ${data.elecScope === 'total' ? 'completa (cuadro y cableado)' : 'parcial (mecanismos)'}.`);
    } else if (data.renovateElectricalPanel) {
        parts.push("Electricidad: Se requiere renovar el cuadro eléctrico.");
    }

    if (data.installAirConditioning) {
        parts.push(`Climatización: Instalación de aire acondicionado tipo ${data.hvacType || 'split'} (${data.hvacCount} unidades/puntos).`);
    }

    // 7. Cocina
    if (data.kitchen?.renovate) {
        const k = data.kitchen;
        let kDesc = `Reforma de cocina (Calidad ${k.quality}).`;
        if (k.demolition) kDesc += " Incluye demoliciones previas.";
        kDesc += ` Superficies: ${k.wallTilesM2} m² de alicatado y ${k.floorM2} m² de suelo.`;
        if (k.plumbing) kDesc += " Se renueva la fontanería.";
        parts.push(kDesc);
    }

    // 8. Baños
    if (data.bathrooms && data.bathrooms.length > 0) {
        data.bathrooms.forEach((b, idx) => {
            let bDesc = `Baño ${idx + 1} (Calidad ${b.quality}): ${b.wallTilesM2} m² alicatado, ${b.floorM2} m² suelo.`;
            const extras: string[] = [];
            if (b.installShowerTray) extras.push("plato de ducha");
            if (b.installShowerScreen) extras.push("mampara");
            if (b.plumbing) extras.push("fontanería completa");
            if (extras.length > 0) bDesc += ` Incluye: ${extras.join(', ')}.`;
            parts.push(bDesc);
        });
    }

    return parts.join(' ');
};
