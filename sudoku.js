import graphlib from 'graphlib'

const graph = new graphlib.Graph({ directed: false })

const dimension = 2

const numbers = Array.from({ length: dimension ** 4 }, (_, i) => i + 1)

numbers.forEach(n => {
    const line = Math.ceil(n / dimension ** 2)
    const column = n % dimension ** 2 == 0 ? dimension ** 2 : n % dimension ** 2
    graph.setNode(`${line}-${column}`)
})

numbers.forEach(n => {
    const line = Math.ceil(n / dimension ** 2)
    const column = n % dimension ** 2 == 0 ? dimension ** 2 : n % dimension ** 2
    const line_quadrant = Math.ceil(line / dimension)
    const column_quadrant = Math.ceil(column / dimension)

    const line_re = new RegExp(`^${line}-`)
    const line_neighbors = graph.nodes().filter(n => line_re.test(n))

    const column_re = new RegExp(`-${column}$`)
    const column_neighbors = graph.nodes().filter(n => column_re.test(n))

    const quadrant_neighbors = numbers
        .filter(m => {
            if (m != n) {
                const m_line = Math.ceil(m / dimension ** 2)
                const m_column = m % dimension ** 2 == 0 ? dimension ** 2 : m % dimension ** 2
                const m_line_quadrant = Math.ceil(m_line / dimension)
                const m_column_quadrant = Math.ceil(m_column / dimension)
                return line_quadrant == m_line_quadrant && column_quadrant == m_column_quadrant
            }
            else {
                return false
            }
        })
        .map(m => {
            const l = Math.ceil(m / dimension ** 2)
            const c = m % dimension ** 2 == 0 ? dimension ** 2 : m % dimension ** 2
            return `${l}-${c}`
        })
    
    const node = `${line}-${column}`
    const neighbors = [... new Set([...line_neighbors, ...column_neighbors, ...quadrant_neighbors])]
        .filter(m => m != node)

    neighbors.forEach(neighbor => {
        graph.setEdge(node, neighbor)
    })
})

console.log(graph.nodes().length)
console.log(graph.edges().length)

const ordenado = graph.nodes()

const relacao_cores = ordenado.reduce((prev, cur) => {
    prev[cur] = undefined
    return prev
}, {})

let cont_cor = 1
let check = Object.entries(relacao_cores).some(([_, valor]) => valor == undefined)

while (check) {
    const primeiro_incolor = ordenado.find(node => relacao_cores[node] == undefined)
    relacao_cores[primeiro_incolor] = cont_cor
    ordenado.forEach(node => {
        const com_mesma_cor = Object.entries(relacao_cores).filter(([_, cor]) => cor == cont_cor).map(([n]) => n)
        const check_vizinho_com_mesma_cor = com_mesma_cor.every(n => !graph.hasEdge(node, n))
        if (relacao_cores[node] == undefined && check_vizinho_com_mesma_cor) {
            relacao_cores[node] = cont_cor
        }
    })
    console.log(cont_cor)
    check = Object.entries(relacao_cores).some(([_, valor]) => valor == undefined)
    cont_cor++
}

console.log(relacao_cores)