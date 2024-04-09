import fs from 'fs'
import * as turf from '@turf/turf'
import slugify from 'slugify'
import graphlib from 'graphlib'

slugify.extend({ '\'': '' })

const data = fs.readFileSync('./data/estado-sp-municipios.json')
let features = JSON.parse(data).features

const grafo = new graphlib.Graph({ directed: false })

for (let i = 0; i < features.length; i++) {
    const feature = features[i]
    const turfFeature = turf.feature(feature.geometry)

    for (let j = 0; j < features.length; j++) {
        if (i != j) {
            const otherFeature = features[j]
            const otherTurfFeature = turf.feature(otherFeature.geometry)

            if (turf.booleanOverlap(turfFeature, otherTurfFeature)) {
                const nodeASlug = slugify(feature.properties.name, { lower: true })
                const nodeBSlug = slugify(otherFeature.properties.name, { lower: true })

                if (!grafo.hasNode(nodeASlug)) {
                    const [xa, ya] = turf.centroid(feature).geometry.coordinates
                    grafo.setNode(nodeASlug, { position: { x: xa, y: ya } })
                }

                if (!grafo.hasNode(nodeBSlug)) {
                    const [xb, yb] = turf.centroid(otherFeature).geometry.coordinates
                    grafo.setNode(nodeBSlug, { position: { x: xb, y: yb } })
                }

                grafo.setEdge(nodeASlug, nodeBSlug)
                console.log(i, features.length, nodeASlug, nodeBSlug)
            }
            else {
                const slug = slugify(feature.properties.name, { lower: true })
                if (!grafo.hasNode(slug)) {
                    const [x, y] = turf.centroid(feature).geometry.coordinates
                    grafo.setNode(slug, { position: { x, y } })
                }
            }
        }
    }
}

const ordenado = grafo.nodes()
    .sort((a, b) => {
        return grafo.nodeEdges(a).length > grafo.nodeEdges(b).length ? -1 : 1
    })

const relacao_cores = ordenado.reduce((prev, cur) => {
    prev[cur] = undefined
    return prev
}, {})

let cont_cor = 0
let check = Object.entries(relacao_cores).some(([_, valor]) => valor == undefined)

while (check) {
    const primeiro_incolor = ordenado.find(node => relacao_cores[node] == undefined)
    relacao_cores[primeiro_incolor] = cont_cor
    ordenado.forEach(node => {
        const com_mesma_cor = Object.entries(relacao_cores).filter(([_, cor]) => cor == cont_cor).map(([n]) => n)
        const check_vizinho_com_mesma_cor = com_mesma_cor.every(n => !grafo.hasEdge(node, n))
        if (relacao_cores[node] == undefined && !grafo.hasEdge(node, primeiro_incolor) && check_vizinho_com_mesma_cor) {
            relacao_cores[node] = cont_cor
        }
    })
    console.log(cont_cor)
    check = Object.entries(relacao_cores).some(([_, valor]) => valor == undefined)
    cont_cor++
}

features = features.map(feature => {
    const slug = slugify(feature.properties.name, { lower: true })
    const color = relacao_cores[slug]
    feature.properties.color = color
    return feature
})

const result = { type: "FeatureCollection", features }

const nGrafo = new graphlib.Graph({ directed: false })
grafo.nodes().forEach(node => {
    const color = relacao_cores[node]
    const info = grafo.node(node)
    nGrafo.setNode(node, { ...info, color })
})
grafo.edges().forEach(edge => {
    nGrafo.setEdge(edge.v, edge.w)
})

const grafoJson = graphlib.json.write(nGrafo)

fs.writeFileSync('./result/estado-sp-municipios-grafo.json', JSON.stringify(grafoJson))
fs.writeFileSync('./result/estado-sp-municipios.geojson', JSON.stringify(result))