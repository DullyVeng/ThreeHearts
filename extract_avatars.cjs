const fs = require('fs');
const path = require('path');

const htmlPath = 'e:\\Project\\ThreeHearts\\doc\\stitch_home_screen_variant_1\\stitch_home_screen_variant_1\\code.html';
const outputDir = 'e:\\Project\\ThreeHearts\\public\\avatars';

// Animal names in order of appearance based on the design description
// 3x3 grid: Cat, Pig, Rabbit / Fox, Dog, Bear / Chick, Panda, Mouse
const animalNames = [
    'cat', 'pig', 'rabbit',
    'fox', 'dog', 'bear',
    'chick', 'panda', 'mouse'
];

try {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Regex to find data URIs
    // Looking for src="data:image/png;base64,....."
    const regex = /src="data:image\/png;base64,([^"]+)"/g;

    let match;
    let index = 0;

    while ((match = regex.exec(htmlContent)) !== null) {
        if (index >= animalNames.length) break;

        const base64Data = match[1];
        const animalName = animalNames[index];
        const fileName = `${animalName}.png`;
        const filePath = path.join(outputDir, fileName);

        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        console.log(`Saved ${fileName}`);

        index++;
    }

    console.log(`Extracted ${index} images`);

} catch (err) {
    console.error('Error:', err);
}
