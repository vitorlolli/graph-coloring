import sharp from "sharp"
import { JSDOM } from "jsdom"
import { select, geoPath, geoMercator } from "d3"
import fs from 'fs'

const geoJSON = JSON.parse(fs.readFileSync('./result/estado-sp-municipios.geojson'))

const window = new JSDOM(undefined, { pretendToBeVisual: true }).window

window.d3 = select(window.document)

const svg = window.d3
    .select("body")
    .append("div")
    .attr("class", "container")
    .append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", 1000)
    .attr("height", 1000)
    .append("g")

const projection = geoMercator().fitSize([1000, 1000], {
    type: "FeatureCollection",
    features: geoJSON.features,
})

const geoGenerator = geoPath().projection(projection)

svg
    .selectAll("path")
    .data(geoJSON.features)
    .join("path")
    .attr("d", geoGenerator)
    .attr("fill", feature => {
        return 'black'
    })
    .attr("stroke", "#fff")

await sharp(Buffer.from(window.d3.select(".container").html()))
    .png()
    .toFile(`teste.png`)