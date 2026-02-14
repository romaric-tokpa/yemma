#!/usr/bin/env node
/**
 * Génère le brand system d'icônes à partir de logo-icon.svg
 * Usage: node scripts/generate-favicons.mjs
 * Requiert: npm install sharp --save-dev
 */
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const svgPath = join(publicDir, 'logo-icon.svg')

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
]

async function generate() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('Erreur: sharp n\'est pas installé. Exécutez: npm install sharp --save-dev')
    process.exit(1)
  }

  const svg = readFileSync(svgPath)

  for (const { name, size } of sizes) {
    const outPath = join(publicDir, name)
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log(`✓ ${name} (${size}x${size})`)
  }

  // favicon.ico (format ICO pour compatibilité legacy)
  try {
    const toIco = (await import('to-ico')).default
    const png32 = await sharp(svg).resize(32, 32).png().toBuffer()
    const png16 = await sharp(svg).resize(16, 16).png().toBuffer()
    const ico = await toIco([png16, png32])
    writeFileSync(join(publicDir, 'favicon.ico'), ico)
    console.log('✓ favicon.ico (16x16, 32x32)')
  } catch (e) {
    console.warn('favicon.ico non généré (installez to-ico). Utilisez favicon-32x32.png en fallback.')
  }

  console.log('\nBrand system généré avec succès.')
}

generate().catch((err) => {
  console.error(err)
  process.exit(1)
})
