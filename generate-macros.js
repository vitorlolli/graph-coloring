import { readFileSync, writeFileSync } from 'fs'
import slugify from 'slugify'
import stringSimilarity from 'string-similarity'

let macros_municipios = [
    {
        name: "MACRO 1-A",
        color: "#1186B9"
    },
    {
        name: "MACRO 1-B",
        color: "#023E57"
    },
    {
        name: "MACRO 2-A",
        color: "#EF8722"
    },
    {
        name: "MACRO 2-B",
        color: "#E6DB31"
    },
    {
        name: "MACRO 3",
        color: "#831216"
    },
    {
        name: "MACRO 4-A",
        color: "#46007A"
    },
    {
        name: "MACRO 4-B",
        color: "#BFBFBF"
    },
    {
        name: "MACRO 5-C",
        color: "#4D4D4D"
    }
]

let macros_distritos = [
    {
        name: "MACRO 5-A",
        color: "#DDBBAD",
        zonas: ['norte', 'leste', 'centro']
    },
    {
        name: "MACRO 5-B",
        color: "#97BA38",
        zonas: ['oeste', 'sul']
    }
]

const municipios_macros = JSON.parse(readFileSync('./data/municipios-macro.json'))
const municipios_geo_json = JSON.parse(readFileSync('./data/estado-sp-municipios.json'))

macros_municipios = macros_municipios.map(macro => {
    const municipios = municipios_macros
        .filter(municipio => municipio.macro == macro.name)
        .map(municipio => {
            const slug_municipio = slugify(municipio.municipio, { lower: true })
            const feature = municipios_geo_json.features.find(feature => {
                const slug_feature = slugify(feature.properties.name, { lower: true })
                const check = stringSimilarity.compareTwoStrings(slug_feature, slug_municipio)
                return check == 1
            })
            if (!feature) {
                console.log({
                    slug_municipio
                })
            }
            return {
                ...municipio,
                feature
            }
        })

    const features = municipios.map(municipio => municipio.feature)

    const geoJson = {
        type: "FeatureCollection",
        properties: macro,
        features
    }

    return geoJson
})

let distritos_zona = JSON.parse(readFileSync('./data/distritos-zona.json'))
const distritos_geo_json_features = JSON.parse(readFileSync('./data/cidade-sp-distritos.json'))
    .features
    .map(({ type, geometry, properties }) => ({ type, geometry, properties: { name: properties.ds_nome } }))

distritos_zona = distritos_zona.map(zona => {
    const distritos = zona.distritos
    const features_zona = []
    distritos.forEach(distrito => {
        const slug_distrito = slugify(distrito.toLowerCase())
        const feature = distritos_geo_json_features.find(f => {
            const slug_feature = slugify(f.properties.name, { lower: true })
            return slug_distrito == slug_feature
        })
        if (feature) {
            features_zona.push(feature)
        }
    })
    return {
        name: zona.nome,
        features: features_zona
    }
})

macros_distritos = macros_distritos.map(macro => {
    const zonas = distritos_zona.filter(item => macro.zonas.includes(slugify(item.name.toLowerCase())))
    const features = zonas.map(zona => zona.features).flatMap(item => item)
    return {
        type: "FeatureCollection",
        properties: macro,
        features
    }
})

const macros = [
    ...macros_municipios,
    ...macros_distritos
].sort((a, b) => {
    return a.properties.name > b.properties.name ? 1 : -1
})

writeFileSync('./result/macros-geojson.geojson', JSON.stringify(macros))