const fs = require('fs');
const path = require('path');

// Step 1: Load the shortest paths data
const allShortestPaths = require('./all_shortest_paths.json');

// Step 2: Implement the function to find the best two chains with dynamic hops
function findMaxReachableChains(paths, maxHops) {
    const reachableChains = {};
    const chainPairs = Object.keys(paths);

    chainPairs.forEach((pairKey) => {
        const path = paths[pairKey];
        if (path.length - 1 <= maxHops) {
            const [start, destination] = pairKey.split(' -> ');
            reachableChains[start] = reachableChains[start] || new Set();
            reachableChains[start].add(destination);
        }
    });

    const bestPairs = {};
    const allChains = Object.keys(reachableChains);

    for (let i = 0; i < allChains.length; i++) {
        for (let j = i + 1; j < allChains.length; j++) {
            const chainA = allChains[i];
            const chainB = allChains[j];

            const combinedReach = new Set([
                ...reachableChains[chainA] || [],
                ...reachableChains[chainB] || []
            ]);

            const pairKey = `${chainA} & ${chainB}`;
            bestPairs[pairKey] = combinedReach.size;
        }
    }

    // Provide an initial value to the reduce function
    const maxReachPair = Object.entries(bestPairs).reduce(
        (a, b) => b[1] > a[1] ? b : a,
        ['', 0] // Initial value: ['', 0] (an empty pair with a count of 0)
    );

    console.log(`Best Pair: ${maxReachPair[0]} can reach ${maxReachPair[1]} chains within ${maxHops} hops.`);

    return {
        bestPair: maxReachPair[0],
        reachCount: maxReachPair[1]
    };
}

// Step 3: Output the result with a dynamic number of hops
const maxHops = 0;  
const result = findMaxReachableChains(allShortestPaths, maxHops);

// Save the result to a file
fs.writeFileSync(path.join(__dirname, `max_reachable_chains_${maxHops}_hops.json`), JSON.stringify(result, null, 2));

console.log(`Result saved to 'max_reachable_chains_${maxHops}_hops.json'.`);
