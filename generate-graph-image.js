import sharp from "sharp"
import { JSDOM } from "jsdom"
import * as d3 from "d3"
import fs from 'fs'

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
    .attr("viewBox", [menorX - margin, menorY - margin, (maiorX - menorX) + (margin * 2), (maiorY - menorY) + (margin * 2)])

svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr('id', d => d.id)
    .attr("r", 30)
    .attr("fill", d => 'green')
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)

svg.append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr('id', d => `${d.source.id}-${d.target.id}`)
    .attr("stroke", "red")
    .attr("stroke-width", 5)
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)

await sharp(Buffer.from(window.d3.select(".container").html()))
    .png()
    .toFile(`./result/graph.png`)