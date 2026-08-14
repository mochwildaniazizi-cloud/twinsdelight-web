const fs = require('fs');
const path = require('path');
const src = "C:\\Users\\mochw\\.gemini\\antigravity-ide\\brain\\075f7eee-73f4-4626-baa2-3cc0bdce4c70\\icon_512_1786394978147.png";
const dest512 = "c:\\Code\\twinsdelight-web\\public\\icon-512.png";
const dest192 = "c:\\Code\\twinsdelight-web\\public\\icon-192.png";

try {
  fs.copyFileSync(src, dest512);
  fs.copyFileSync(src, dest192);
  console.log("Success copying PWA icons!");
} catch (err) {
  console.error("Error copying icons:", err);
}
