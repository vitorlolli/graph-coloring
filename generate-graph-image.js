import sharp from "sharp"
import { JSDOM } from "jsdom"
import * as d3 from "d3"
import fs from 'fs'

// const grafo = JSON.parse(fs.readFileSync('./result/estado-sp-municipios-grafo.json'))
// const nodes = grafo.nodes.map(node => ({ id: node, label: node, x: node.value.position.x, y: node.value.position.y }))

const window = new JSDOM(undefined, { pretendToBeVisual: true }).window
window.d3 = d3.select(window.document)

const graph = {
    nodes: [
        { "id": "0", "name": "nytimes", "count": 0, "category": 0 },
        { "id": "1", "name": "hbo", "count": 1, "category": 1 },
        { "id": "2", "name": "fenty beauty gloss bomb universal lip luminizer", "count": 1, "category": 1 },
    ],
    links: [
        { "source": "0", "target": "1", "value": 1, "count": 1 },
        { "source": "0", "target": "2", "value": 1, "count": 1 },
    ]
}

const width = 960
const height = 600

const svg = window.d3
    .select("body")
    .append("div")
    .attr("class", "container")
    .append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", width)
    .attr("height", height)

const simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) { return d.id; }))
    .force('charge', d3.forceManyBody()
        .strength(-1900)
        .theta(0.5)
        .distanceMax(1500)
    )
    .force('collision', d3.forceCollide().radius(function (d) {
        return d.radius
    }))
    .force("center", d3.forceCenter())

var link = svg.append("g")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")

link
    .style("stroke", "#aaa");

var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
    //I made the article/source nodes larger than the entity nodes
    .attr("r", function (d) { return d.category == 0 ? 45 : 35 });

node
    .style("fill", "#cccccc")
    .style("fill-opacity", "0.9")
    .style("stroke", "#424242")
    .style("stroke-width", "1px");

var label = svg.append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(graph.nodes)
    .enter().append("text")
    .text(function (d) { return d.name; })
    .attr("class", "label")

label
    .style("text-anchor", "middle")
    .style("color", "red")
    .style("font-size", "40px");

function ticked() {
    link
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node
        .attr("cx", function (d) { return d.x + 5; })
        .attr("cy", function (d) { return d.y - 3; });

    label
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; });
}

simulation
    .nodes(graph.nodes)
    .on("tick", ticked);

simulation.force("link")
    .links(graph.links);

await sharp(Buffer.from(window.d3.select(".container").html()))
    .png()
    .toFile(`teste.png`)