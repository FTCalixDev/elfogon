import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

function ensureMenuAssetsExtracted(rootDir: string) {
  const outDir = path.resolve(rootDir, 'public/assets/menu');
  const pdfPath = path.resolve(rootDir, 'public/assets/aistudio/Menu_e17c3b8d.pdf');
  const markerFile = path.resolve(outDir, 'dish_parrilla_hero.jpg');
  const pageFile = path.resolve(outDir, 'page_01.jpg');
  const logoFile = path.resolve(outDir, 'woodcut_gold.png');

  if (
    fs.existsSync(markerFile) &&
    fs.existsSync(pageFile) &&
    fs.existsSync(logoFile)
  ) {
    return;
  }

  if (!fs.existsSync(pdfPath)) {
    return;
  }

  try {
    fs.mkdirSync(outDir, {recursive: true});
    const buf = fs.readFileSync(pdfPath);
    let pos = 0;
    let idx = 0;
    const startMarker = Buffer.from([0xff, 0xd8, 0xff]);
    const endMarker = Buffer.from([0xff, 0xd9]);

    while (pos < buf.length) {
      const s = buf.indexOf(startMarker, pos);
      if (s === -1) break;
      const endStreamPos = buf.indexOf(Buffer.from('endstream'), s);
      if (endStreamPos === -1) break;
      let e = -1;
      let searchPos = s;
      while (true) {
        const nextE = buf.indexOf(endMarker, searchPos);
        if (nextE === -1 || nextE > endStreamPos) break;
        e = nextE + 2;
        searchPos = nextE + 2;
      }
      if (e !== -1 && e - s > 5000) {
        idx++;
        const rawOut = path.resolve(
          outDir,
          `raw_${String(idx).padStart(2, '0')}.jpg`
        );
        fs.writeFileSync(rawOut, buf.slice(s, e));
        pos = e;
      } else {
        pos = s + 3;
      }
    }

    // Render all 16 PDF pages
    execSync(
      `gs -dSAFER -dBATCH -dNOPAUSE -sDEVICE=jpeg -dJPEGQ=82 -r110 -sOutputFile="${outDir}/page_%02d.jpg" "${pdfPath}"`,
      {stdio: 'ignore'}
    );

    // Render page 1 at 300 DPI for ultra-crisp official woodcut logo
    const p1High = path.resolve(outDir, 'p1_300.png');
    execSync(
      `gs -dSAFER -dBATCH -dNOPAUSE -dFirstPage=1 -dLastPage=1 -sDEVICE=png16m -r300 -sOutputFile="${p1High}" "${pdfPath}"`,
      {stdio: 'ignore'}
    );
    execSync(
      `convert "${p1High}" -crop 1030x310+760+475 +repage -fuzz 30% -transparent "#f9f1e2" -fill "#163024" -colorize 100 "${outDir}/woodcut_green.png"`,
      {stdio: 'ignore'}
    );
    execSync(
      `convert "${p1High}" -crop 1030x310+760+475 +repage -fuzz 30% -transparent "#f9f1e2" -fill "#d9a04e" -colorize 100 "${outDir}/woodcut_gold.png"`,
      {stdio: 'ignore'}
    );
    execSync(
      `convert -size 440x170 xc:"#d4a253" \\( "${outDir}/woodcut_green.png" -resize 360x105 \\) -gravity north -geometry +0+16 -composite -gravity south -fill "#163024" -font "DejaVu-Serif-Bold" -pointsize 21 -annotate +0+18 "PARRILLADA RESTAURANTE" -quality 90 "${outDir}/logo_official_gold.jpg"`,
      {stdio: 'ignore'}
    );

    // Crop individual dishes cleanly
    const crops: Array<[string, string, string, string]> = [
      ['raw_01.jpg', '741x560+0+80', '600x450', 'dish_dry_ager.jpg'],
      ['raw_01.jpg', '741x580+0+900', '600x450', 'dish_bife_plato.jpg'],
      ['raw_01.jpg', '741x600+0+1750', '600x450', 'dish_french_rack.jpg'],
      ['raw_02.jpg', '836x900+0+720', '720x540', 'dish_parrilla_hero.jpg'],
      ['raw_02.jpg', '836x640+0+1080', '600x450', 'dish_parrilla_cortes.jpg'],
      ['raw_02.jpg', '836x640+0+520', '600x450', 'dish_asado_lena.jpg'],
      ['raw_03.jpg', '835x660+0+180', '600x450', 'dish_paella.jpg'],
      ['raw_03.jpg', '835x620+0+1420', '600x450', 'dish_vino.jpg'],
      ['raw_04.jpg', '835x680+0+1150', '600x450', 'dish_raviolones.jpg'],
      ['raw_05.jpg', '1550x1160+980+480', '600x450', 'dish_costilla_dry.jpg'],
      ['raw_05.jpg', '880x660+60+40', '600x450', 'dish_jamon_caprese.jpg'],
      ['raw_06.jpg', '794x640+0+260', '600x450', 'dish_master_baby.jpg'],
      ['raw_07.jpg', '640x520+460+450', '600x450', 'dish_flan.jpg'],
      ['raw_07.jpg', '580x480+0+20', '600x450', 'dish_panqueque.jpg'],
      ['raw_07.jpg', '580x480+0+900', '600x450', 'dish_creme_brulee.jpg'],
      ['raw_07.jpg', '580x480+960+20', '600x450', 'dish_tarta_manzana.jpg'],
      ['raw_07.jpg', '580x480+960+900', '600x450', 'dish_tiramisu.jpg'],
    ];

    for (const [srcName, cropGeom, sizeGeom, outName] of crops) {
      execSync(
        `convert "${outDir}/${srcName}" -crop ${cropGeom} +repage -resize ${sizeGeom}^ -gravity center -extent ${sizeGeom} -quality 82 "${outDir}/${outName}"`,
        {stdio: 'ignore'}
      );
    }
  } catch (err) {
    console.error('Error extracting menu assets:', err);
  }
}

export default defineConfig(() => {
  ensureMenuAssetsExtracted(__dirname);
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
