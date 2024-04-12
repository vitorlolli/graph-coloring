import sharp from "sharp"
import { JSDOM } from "jsdom"
import * as d3 from "d3"
import fs from 'fs'

const data = JSON.parse(fs.readFileSync('./result/estado-sp-municipios-grafo.json'))

const nodes = data.nodes.map(({ v, value: { position: { x, y } } }) => ({ id: v, x, y }))

const nodesOrdemX = nodes.toSorted((a, b) => a.x > b.x ? 1 : -1)
const nodesOrdemY = nodes.toSorted((a, b) => a.y > b.y ? 1 : -1)

console.log(nodesOrdemX[0].x, nodesOrdemX[nodesOrdemX.length - 1].x)
console.log(nodesOrdemY[0].y, nodesOrdemY[nodesOrdemY.length - 1].y)

const links = data.edges.map(({ v, w }) => ({ source: v, target: w }))

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
    .attr("viewBox", [nodesOrdemX[0].x, nodesOrdemY[0].y, width, height])
    // .attr("viewBox", [-width / 2, -height / 2, width, height])

svg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 10)
    .attr("cx", (d, i) => {
        return d.x
    })
    .attr("cy", (d, i) => {
        return d.y
    })
    .attr("fill", d => 'red')

// svg.append("g")
//     .selectAll("line")
//     .data(links)
//     .enter().append("line")
//     .attr("stroke", "red")
//     .attr("x1", (d, i) => {
//         return d.source.x * 2
//     })
//     .attr("y1", (d, i) => {
//         return d.source.y * 2
//     })
//     .attr("x2", (d, i) => {
//         return d.target.x * 2
//     })
//     .attr("y2", (d, i) => {
//         return d.target.y * 2
//     })

// const node = svg.append("g")
//     .attr("stroke", "#fff")
//     .attr("stroke-width", 1.5)
//     .selectAll("circle")
//     .data(nodes)
//     .join("circle")
//     .attr("r", 10)
//     .attr("cx", (d, i) => {
//         return d.x * 2
//     })
//     .attr("cy", (d, i) => {
//         return d.y * 2
//     })
//     .attr("fill", d => color(d.group));

await sharp(Buffer.from(window.d3.select(".container").html()))
    .png()
    .toFile(`teste.png`)