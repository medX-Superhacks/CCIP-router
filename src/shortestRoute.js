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

// Chain selectors and CCIP router addresses
const chainData = {
    "Amoy testnet": {
        selector: "16281711391670634445",
        ccipMultiHopRouter: "0x40Fee4c8A3a66Dba113b881Dca0E4B2828b86BB7"
    },
    "Arbitrum Sepolia testnet": {
        selector: "3478487238524512106",
        ccipMultiHopRouter: "0x309222b7833D3D0A59A8eBf9C64A5790bf43E2aA"
    },
    "Base Sepolia testnet": {
        selector: "10344971235874465080",
        ccipMultiHopRouter: "0x273C282A9f1B45416CB9967611d431C116286ef9"
    },
    "Blast Sepolia testnet": {
        selector: "2027362563942762617",
        ccipMultiHopRouter: "N/A" // No router address provided for Blast Sepolia
    },
    "BNB Chain testnet": {
        selector: "13264668187771770619",
        ccipMultiHopRouter: "N/A" // No router address provided for BNB Chain testnet
    },
    "Celo Alfajores testnet": {
        selector: "16015286601757825753",
        ccipMultiHopRouter: "N/A" // No router address provided for Celo Alfajores
    },
    "Fuji testnet": {
        selector: "14767482510784806043",
        ccipMultiHopRouter: "N/A" // No router address provided for Fuji testnet
    },
    "Gnosis Chiado testnet": {
        selector: "8871595565390010547",
        ccipMultiHopRouter: "N/A" // No router address provided for Gnosis Chiado
    },
    "Kroma Sepolia testnet": {
        selector: "5990477251245693094",
        ccipMultiHopRouter: "N/A" // No router address provided for Kroma Sepolia
    },
    "Metis Sepolia testnet": {
        selector: "3777822886988675105",
        ccipMultiHopRouter: "N/A" // No router address provided for Metis Sepolia
    },
    "Mode Sepolia testnet": {
        selector: "829525985033418733",
        ccipMultiHopRouter: "N/A" // No router address provided for Mode Sepolia
    },
    "Optimism Sepolia testnet": {
        selector: "5224473277236331295",
        ccipMultiHopRouter: "0xF99b791257ab50be7F235BC825E7d4B83942cf38"
    },
    "Sepolia testnet": {
        selector: "16015286601757825753",
        ccipMultiHopRouter: "0x96EE5fb7bc57C1f03D560Fcb1b8574ddC8bf5F37"
    },
    "Wemix testnet": {
        selector: "9284632837123596123",
        ccipMultiHopRouter: "N/A" // No router address provided for Wemix testnet
    }
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
                        sourceSelector: chainData[source].selector,
                        destinationSelector: chainData[destination].selector,
                        sourceCCIPRouter: chainData[source].ccipMultiHopRouter,
                        destinationCCIPRouter: chainData[destination].ccipMultiHopRouter
                    };
                } else {
                    allPaths[`${source} -> ${destination}`] = {
                        path: "No path found",
                        sourceSelector: chainData[source].selector,
                        destinationSelector: chainData[destination].selector,
                        sourceCCIPRouter: chainData[source].ccipMultiHopRouter,
                        destinationCCIPRouter: chainData[destination].ccipMultiHopRouter
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
savePathsToFile(allShortestPaths, '../data/all_shortest_paths_with_selectors_and_ccip.json');

console.log("All shortest paths have been calculated and saved to 'all_shortest_paths_with_selectors_and_ccip.json'.");
