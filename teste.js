import sharp from "sharp"
import { JSDOM } from "jsdom"
import * as d3 from "d3"
import fs from 'fs'

const data = JSON.parse(fs.readFileSync('./data.json'))

const window = new JSDOM(undefined, { pretendToBeVisual: true }).window
window.d3 = d3.select(window.document)

const width = 1000;
const height = 1000;

// Specify the color scale.
const color = d3.scaleOrdinal(d3.schemeCategory10);

const links = data.links.map(d => ({ ...d }));
const nodes = data.nodes.map(d => ({ ...d }));

d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))

const svg = window.d3
    .select("body")
    .append("div")
    .attr("class", "container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])

svg.append("g")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke", "red")
    .attr("x1", (d, i) => {
        return d.source.x * 2
    })
    .attr("y1", (d, i) => {
        return d.source.y * 2
    })
    .attr("x2", (d, i) => {
        return d.target.x * 2
    })
    .attr("y2", (d, i) => {
        return d.target.y * 2
    })

const node = svg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 10)
    .attr("cx", (d, i) => {
        return d.x * 2
    })
    .attr("cy", (d, i) => {
        return d.y * 2
    })
    .attr("fill", d => color(d.group));

await sharp(Buffer.from(window.d3.select(".container").html()))
    .png()
    .toFile(`teste.png`)