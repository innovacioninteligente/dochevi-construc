
const desc = "Acondicionamiento de zona exterior para acopio de balas de paja consistente en montaje de cubierta impermeable desmontable. Incluso desmontaje, retirada y transporte. Completamente instalado y desinstalado. Limpieza de zona de trabajo. B0001.0030 0,100 h oficial 1ª 28,59 2,86 B0001.0070 0,100 22. Peon suelto 23,01 2,30 B1702.0010 2,400 ML tubo redondo acero galvan 16x1.5 2,05 4,92 B1904.0130 0,200 h compresor 25 hp con un martillo 2,98 0,60 B1421.0040 0,200 u plca. traslucida granond 152x110 55,10 11,02 B1206.0010 6,000 u gancho galv.granonda IPN8 0,50 3,00 B3008.0340 0,250 h retroexcavadora de 0.5 m3 32,25 8,06 Movimiento de tierras";

console.log("Original length:", desc.length);

// Attempt 1: Users current regex
const regex1 = /\s+[A-Z]\d{4}\.\d{4}.*$/;
const cleaned1 = desc.replace(regex1, ' [CLEANED]');
console.log("Regex 1 match:", regex1.test(desc));
console.log("Result 1:", cleaned1.slice(-50)); // Show end

// Attempt 2: Looser regex
const regex2 = /[\s\.]+[A-Z]\d{4}\.\d{4}.*$/;
const cleaned2 = desc.replace(regex2, ' [CLEANED]');
console.log("Regex 2 match:", regex2.test(desc));

// Attempt 3: Even looser
const regex3 = /(?:[\s\.]|^)[A-Z]\d{4}\.\d{4}.*$/;

// Debug: Position of pattern
const match = desc.match(/B0001\.0030/);
if (match) {
    console.log("Found 'B0001.0030' at index:", match.index);
    const context = desc.substring(match.index - 10, match.index + 20);
    console.log("Context:", JSON.stringify(context));
    // Check char codes before B
    for (let i = matches.index - 5; i < match.index; i++) {
        console.log(`Char at ${i}: '${desc[i]}' (${desc.charCodeAt(i)})`);
    }
} else {
    console.log("Substring 'B0001.0030' NOT FOUND");
}
