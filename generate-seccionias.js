import { readFileSync, writeFileSync } from 'fs'
import slugify from 'slugify'

let seccionais = JSON.parse(readFileSync('./data/seccionais.json').toString())
const municipios_geo_json = JSON.parse(readFileSync('./data/estado-sp-municipios.json'))

seccionais = seccionais.map(({ nome, coordenadas: { latitude, longitude }, cidades }) => {
    let cidades_arr = Object.entries(cidades).map((([ key ]) => ({ name: key })))
    cidades_arr = cidades_arr
        .map(cidade => municipios_geo_json.features.find(feature => slugify(cidade.name, { lower: true }) == slugify(feature.properties.name, { lower: true })))
        .filter(cidade => !!cidade)
    return {
        name: nome,
        coordenadas: [ latitude, longitude ],
        geoJsonMunicipios: {
            type: "FeatureCollection",
            features: cidades_arr
        }
    }
})

writeFileSync('./result/seccionais.geojson', JSON.stringify(seccionais))