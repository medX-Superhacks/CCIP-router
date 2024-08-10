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
                    allPaths[`${source} -> ${destination}`] = path;
                } else {
                    allPaths[`${source} -> ${destination}`] = "No path found";
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
savePathsToFile(allShortestPaths, 'all_shortest_paths.json');
