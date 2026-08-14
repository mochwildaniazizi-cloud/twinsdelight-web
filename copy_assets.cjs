const fs = require('fs');
const path = require('path');

const src1 = "C:\\Users\\mochw\\.gemini\\antigravity-ide\\brain\\075f7eee-73f4-4626-baa2-3cc0bdce4c70\\twins_bollen_pastry_1786716469923.png";
const src2 = "C:\\Users\\mochw\\.gemini\\antigravity-ide\\brain\\075f7eee-73f4-4626-baa2-3cc0bdce4c70\\twins_bollen_sliced_1786716614736.png";

const destDir = path.join(__dirname, 'public');
const dest1 = path.join(destDir, 'twins_bollen_pastry.png');
const dest2 = path.join(destDir, 'twins_bollen_sliced.png');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  if (fs.existsSync(src1)) {
    fs.copyFileSync(src1, dest1);
    console.log(`Successfully copied twins_bollen_pastry.png to public/`);
  } else {
    console.error(`Source not found: ${src1}`);
  }

  if (fs.existsSync(src2)) {
    fs.copyFileSync(src2, dest2);
    console.log(`Successfully copied twins_bollen_sliced.png to public/`);
  } else {
    console.error(`Source not found: ${src2}`);
  }
} catch (err) {
  console.error(`Failed to copy assets: ${err.message}`);
}
