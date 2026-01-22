export const WIZARD_STEPS = [
    { id: 'contact', fields: ['name', 'email', 'phone', 'address'] },
    { id: 'projectDefinition', fields: ['propertyType', 'projectScope', 'totalAreaM2', 'numberOfRooms', 'numberOfBathrooms', 'partialScope'] },
    { id: 'demolition', fields: ['demolishPartitions', 'demolishPartitionsM2', 'removeDoors', 'removeDoorsAmount'] },
    { id: 'bathroom', fields: ['bathrooms'] },
    { id: 'kitchen', fields: ['kitchen'] },
    { id: 'workArea', fields: ['workstations', 'meetingRooms'] },
    { id: 'ceilings', fields: ['installFalseCeiling', 'falseCeilingM2', 'soundproofRoom', 'soundproofRoomM2'] },
    { id: 'electricity' },
    { id: 'carpentry', fields: ['floorType', 'skirtingBoardLinearMeters', 'renovateInteriorDoors', 'interiorDoorsAmount', 'doorsMaterial', 'installSlidingDoor', 'slidingDoorAmount', 'renovateExteriorCarpentry', 'externalWindowsCount', 'paintWalls', 'paintWallsM2', 'paintCeilings', 'paintCeilingsM2', 'paintType', 'removeGotele', 'removeGoteleM2'] },
    { id: 'multimedia', fields: ['files'] },
    { id: 'summary' },
];
