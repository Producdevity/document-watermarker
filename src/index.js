const sharp = require('sharp')
const { PDFDocument, rgb, degrees } = require('pdf-lib')
const fs = require('fs')
const readline = require('readline')
const { format } = require('date-fns')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question(
  'Enter the path to your file (image or PDF): ',
  function (filepath) {
    rl.question('Enter the watermark text: ', (watermarkText) => {
      rl.question(
        "Include today's date on the watermark? (yes/no): ",
        function (includeDate) {
          const today =
            includeDate.toLowerCase() === 'yes'
              ? format(new Date(), 'yyyy-MM-dd')
              : ''
          const watermark = `${watermarkText} ${today}`.trim()
          const outputPath = `watermarked_${filepath}`

          if (filepath.endsWith('.pdf')) {
            // Handle PDF watermarking
            fs.readFile(filepath, async (err, data) => {
              if (err) {
                console.error('Error reading PDF file:', err)
                rl.close()
                return
              }
              try {
                const pdfDoc = await PDFDocument.load(data)
                const pages = pdfDoc.getPages()
                pages.forEach((page) => {
                  page.drawText(watermark, {
                    x: 50,
                    y: 50,
                    size: 25,
                    color: rgb(0.95, 0.1, 0.1),
                    rotate: degrees(-45),
                  })
                })
                const pdfBytes = await pdfDoc.save()
                fs.writeFileSync(outputPath, pdfBytes)
                console.log(`Watermarked PDF saved as ${outputPath}`)
                rl.close()
              } catch (pdfErr) {
                console.error('Error processing PDF:', pdfErr)
                rl.close()
              }
            })
          } else {
            // Handle image watermarking
            sharp(filepath)
              .composite([
                {
                  input: Buffer.from(watermark, 'utf-8'),
                  gravity: 'southeast',
                },
              ])
              .toFile(outputPath)
              .then(() => {
                console.log(`Watermarked image saved as ${outputPath}`)
                rl.close()
              })
              .catch((err) => {
                console.error('Error processing image:', err)
                rl.close()
              })
          }
        },
      )
    })
  },
)

rl.on('close', function () {
  process.exit(0)
})
