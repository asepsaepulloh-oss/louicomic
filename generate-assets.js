import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const assetsDir = path.resolve('assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(path.resolve('public/logo.svg'));

  console.log('Generating 1024x1024 icon.png...');
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

  console.log('Generating 1024x1024 icon-only.png...');
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon-only.png'));

  console.log('Generating 1024x1024 icon-foreground.png...');
  const foregroundLogo = await sharp(svgBuffer).resize(660, 660).toBuffer();
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: foregroundLogo, gravity: 'center' }])
    .png()
    .toFile(path.join(assetsDir, 'icon-foreground.png'));

  console.log('Generating 1024x1024 icon-background.png...');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    }
  })
    .png()
    .toFile(path.join(assetsDir, 'icon-background.png'));

  console.log('Generating splash.png...');
  const logoResized = await sharp(svgBuffer).resize(800, 800).toBuffer();
  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    }
  })
    .composite([{ input: logoResized, gravity: 'center' }])
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));

  console.log('Generating public/favicon.png...');
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/favicon.png'));

  console.log('Generating public/apple-touch-icon.png...');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));

  console.log('Asset images generated successfully!');

  // Fix adaptive icon XMLs in android/app/src/main/res/mipmap-anydpi-v26/
  const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>`;

  const mipmapAnyDpiDir = path.resolve('android/app/src/main/res/mipmap-anydpi-v26');
  if (fs.existsSync(mipmapAnyDpiDir)) {
    fs.writeFileSync(path.join(mipmapAnyDpiDir, 'ic_launcher.xml'), xmlContent, 'utf8');
    fs.writeFileSync(path.join(mipmapAnyDpiDir, 'ic_launcher_round.xml'), xmlContent, 'utf8');
    console.log('Fixed ic_launcher.xml and ic_launcher_round.xml adaptive icon definitions!');
  }

  const valuesDir = path.resolve('android/app/src/main/res/values');
  if (fs.existsSync(valuesDir)) {
    const colorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0F172A</color>
</resources>`;
    fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), colorXml, 'utf8');
    console.log('Fixed ic_launcher_background.xml color!');
  }
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
