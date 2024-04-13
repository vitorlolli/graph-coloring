import sharp from 'sharp'
import { JSDOM } from 'jsdom'
import * as d3 from 'd3'
import fs from 'fs'
import GIFEncoder from 'gifencoder'
import { createCanvas, loadImage } from 'canvas'
import { glob } from 'glob'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'

ffmpeg.setFfmpegPath(ffmpegPath)

const chunkArray = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    )

const generateGif = async () => {
    const images = (await glob('./frames/graph-frame-*.png', { withFileTypes: true, stat: true }))
        .sort((a, b) => a.mtimeMs - b.mtimeMs)

    const canvas = createCanvas(1000, 1000)
    const ctx = canvas.getContext('2d')

    const encoder = new GIFEncoder(1000, 1000)
    encoder.createReadStream().pipe(fs.createWriteStream('./result/graph.gif'))
    encoder.start()
    encoder.setRepeat(0)
    encoder.setDelay(.01)
    encoder.setQuality(10)

    for (let index = 0; index < images.length; index++) {
        console.log(index)
        const image = images[index]
        const loaded_image = await loadImage(image.relative())
        ctx.drawImage(loaded_image, 0, 0, loaded_image.width, loaded_image.height, 0, 0, canvas.width, canvas.height)
        encoder.addFrame(ctx)
    }

    encoder.finish()
}

const generateVideo = (
    framesFilepath,
    outputFilepath,
    frameRate,
) => new Promise((resolve, reject) => {
    ffmpeg()

        // Tell FFmpeg to stitch all images together in the provided directory
        .input(framesFilepath)
        .inputOptions([
            // Set input frame rate
            `-framerate ${frameRate}`,
        ])

        .videoCodec('libx264')
        .outputOptions([
            // YUV color space with 4:2:0 chroma subsampling for maximum compatibility with
            // video players
            '-pix_fmt yuv420p',
        ])
        // Set output frame rate
        .fps(frameRate)

        // Resolve or reject (throw an error) the Promise once FFmpeg completes
        .saveToFile(outputFilepath)
        // .on('start', function (commandLine) {
        //     console.log('Processing')
        // })
        .on('end', (error) => {
            if (!error) {
                resolve()
            }
            else {
                reject(new Error(error))
            }
        })
        .on('error', (error) => reject(new Error(error)))
})

const data = JSON.parse(fs.readFileSync('./result/estado-sp-municipios-grafo.json'))

const multiply = 800
const margin = 150

const nodes = data.nodes.map(({ v, value: { position: { x, y } } }) => ({ id: v, x: x * multiply, y: (- y) * multiply }))

const nodesOrdemX = nodes.toSorted((a, b) => a.x > b.x ? 1 : -1)
const menorX = nodesOrdemX[0].x
const maiorX = nodesOrdemX[nodesOrdemX.length - 1].x
const nodesOrdemY = nodes.toSorted((a, b) => a.y > b.y ? 1 : -1)
const menorY = nodesOrdemY[0].y
const maiorY = nodesOrdemY[nodesOrdemY.length - 1].y

const links = data.edges.map(({ v, w }) => ({ id: `${v}-${w}`, source: v, target: w }))

const window = new JSDOM(undefined, { pretendToBeVisual: true }).window
window.d3 = d3.select(window.document)

const width = 1000
const height = 1000

d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(({ id }) => id))

const svg = window.d3
    .select("body")
    .append("div")
    .attr("class", "container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [menorX - margin, menorY - margin, (maiorX - menorX) + (margin * 2), (maiorY - menorY) + (margin * 2)])

svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr('id', d => d.id)
    .attr("r", 30)
    .attr("fill", d => 'transparent')
    .attr("cx", d => {
        return d.x
    })
    .attr("cy", d => {
        return d.y
    })

svg.append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr('id', d => d.id)
    .attr("stroke", "transparent")
    .attr("stroke-width", 5)
    .attr("x1", d => {
        return d.source.x
    })
    .attr("y1", d => {
        return d.source.y
    })
    .attr("x2", d => {
        return d.target.x
    })
    .attr("y2", d => {
        return d.target.y
    })

const elements = [
    ...nodes.toSorted((a, b) => a.x > b.x ? 1 : -1).map(node => ({ ...node, type: 'node' })),
    ...links.toSorted((a, b) => a.source.x > b.source.x ? 1 : -1).map(link => ({ ...link, type: 'link' }))
]

const elements_chuncks = chunkArray(elements, 50)

const props = {
    node: {
        attribute: 'fill',
        color: 'green'
    },
    link: {
        attribute: 'stroke',
        color: 'red'
    }
}

const caractersCountSizeChuncks = String(elements_chuncks.length).length

for (let index = 0; index < elements_chuncks.length; index++) {
    const chunk = elements_chuncks[index]

    chunk.forEach(item => {
        const { attribute, color } = props[item.type]
        window.d3.select(`#${item.id}`).style(attribute, color)
    })

    await sharp(Buffer.from(window.d3.select(".container").html()))
        .png()
        .toFile(`./frames/graph-frame-${String(index).padStart(caractersCountSizeChuncks, '0')}.png`)
}

await generateGif()

await generateVideo(
    `./frames/graph-frame-%0${caractersCountSizeChuncks}d.png`,
    './result/graph.mp4',
    12
)