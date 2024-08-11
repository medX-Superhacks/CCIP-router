const fs = require('fs');
const path = require('path');
const PriorityQueue = require('priorityqueuejs');

// Testnet Graph CCIP
const blockchainGraph = {
    "Amoy testnet": ["BNB Chain testnet", "Fuji testnet", "Gnosis Chiado testnet", "Optimism Sepolia testnet", "Sepolia testnet", "Wemix testnet"],
    "Arbitrum Sepolia testnet": ["Base Sepolia testnet", "Fuji testnet", "Gnosis Chiado testnet", "Optimism Sepolia testnet", "Sepolia testnet", "Wemix testnet"],
    "Base Sepolia testnet": ["Arbitrum Sepolia testnet", "BNB Chain testnet", "Fuji testnet", "Gnosis Chiado testnet", "Mode Sepolia testnet", "Optimism Sepolia testnet", "Sepolia testnet"],
    "BNB Chain testnet": ["Amoy testnet", "Base Sepolia testnet", "Fuji testnet", "Gnosis Chiado testnet", "Sepolia testnet", "Wemix testnet"],
    "Celo Alfajores testnet": ["Sepolia testnet"],
    "Fuji testnet": ["Amoy testnet", "Arbitrum Sepolia testnet", "Base Sepolia testnet", "BNB Chain testnet", "Gnosis Chiado testnet", "Optimism Sepolia testnet", "Sepolia testnet", "Wemix testnet"],
    "Gnosis Chiado testnet": ["Amoy testnet", "Arbitrum Sepolia testnet", "Base Sepolia testnet", "BNB Chain testnet", "Fuji testnet", "Optimism Sepolia testnet", "Sepolia testnet"],
    "Kroma Sepolia testnet": ["Wemix testnet"],
    "Metis Sepolia testnet": ["Sepolia testnet"],
    "Mode Sepolia testnet": ["Base Sepolia testnet", "Sepolia testnet"],
    "Optimism Sepolia testnet": ["Amoy testnet", "Arbitrum Sepolia testnet", "Base Sepolia testnet", "Fuji testnet", "Gnosis Chiado testnet", "Sepolia testnet", "Wemix testnet"],
    "Sepolia testnet": ["Amoy testnet", "Arbitrum Sepolia testnet", "Base Sepolia testnet", "Blast Sepolia testnet", "BNB Chain testnet", "Celo Alfajores testnet", "Fuji testnet", "Gnosis Chiado testnet", "Metis Sepolia testnet", "Mode Sepolia testnet", "Optimism Sepolia testnet", "Wemix testnet"],
    "Wemix testnet": ["Amoy testnet", "Arbitrum Sepolia testnet", "BNB Chain testnet", "Fuji testnet", "Kroma Sepolia testnet", "Optimism Sepolia testnet"]
};

// Chain selectors
const chainSelectors = {
    "Amoy testnet": "16281711391670634445",
    "Arbitrum Sepolia testnet": "3478487238524512106",
    "Base Sepolia testnet": "10344971235874465080",
    "Blast Sepolia testnet": "2027362563942762617",
    "BNB Chain testnet": "13264668187771770619",
    "Celo Alfajores testnet": "16015286601757825753",
    "Fuji testnet": "14767482510784806043",
    "Gnosis Chiado testnet": "8871595565390010547",
    "Kroma Sepolia testnet": "5990477251245693094",
    "Metis Sepolia testnet": "3777822886988675105",
    "Mode Sepolia testnet": "829525985033418733",
    "Optimism Sepolia testnet": "5224473277236331295",
    "Sepolia testnet": "16015286601757825753",
    "Wemix testnet": "9284632837123596123"
};

function dijkstra(graph, start, goal) {
    if (!graph[start] || !graph[goal]) {
        console.log(`Either start node "${start}" or goal node "${goal}" does not exist in the graph.`);
        return null;
    }

    const pq = new PriorityQueue((a, b) => b[0] - a[0]);
    pq.enq([0, start, []]);
    const visited = new Set();

    while (!pq.isEmpty()) {
        const [cost, node, path] = pq.deq();
        if (visited.has(node)) {
            continue;
        }

        visited.add(node);
        const newPath = [...path, node];

        if (node === goal) {
            return newPath;
        }

        if (graph[node]) {
            for (const neighbor of graph[node]) {
                if (!visited.has(neighbor)) {
                    pq.enq([cost + 1, neighbor, newPath]);
                }
            }
        }
    }

    return null;
}

function findAllShortestPaths(graph) {
    const allPaths = {};
    const nodes = Object.keys(graph);

    for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes.length; j++) {
            if (i !== j) {
                const source = nodes[i];
                const destination = nodes[j];
                const path = dijkstra(graph, source, destination);
                if (path) {
                    allPaths[`${source} -> ${destination}`] = {
                        path: path,
                        sourceSelector: chainSelectors[source],
                        destinationSelector: chainSelectors[destination]
                    };
                } else {
                    allPaths[`${source} -> ${destination}`] = {
                        path: "No path found",
                        sourceSelector: chainSelectors[source],
                        destinationSelector: chainSelectors[destination]
                    };
                }
            }
        }
    }

    return allPaths;
}

function savePathsToFile(paths, filename) {
    fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(paths, null, 2));
}

const allShortestPaths = findAllShortestPaths(blockchainGraph);
savePathsToFile(allShortestPaths, '../data/all_shortest_paths_with_selectors.json');

console.log("All shortest paths have been calculated and saved to 'all_shortest_paths_with_selectors.json'.");
