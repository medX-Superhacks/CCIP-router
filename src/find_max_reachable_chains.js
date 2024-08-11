const fs = require('fs');
const path = require('path');

const allShortestPaths = require('../data/all_shortest_paths_with_selectors.json');

function findMaxReachableChains(paths, maxHops) {
    const reachableChains = {};
    const chainPairs = Object.keys(paths);

    chainPairs.forEach((pairKey) => {
        const pathData = paths[pairKey];
        const path = pathData.path;

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

    // Initial value to the reduce function
    const maxReachPair = Object.entries(bestPairs).reduce(
        (a, b) => b[1] > a[1] ? b : a,
        ['', 0]
    );

    const [chainA, chainB] = maxReachPair[0].split(' & ');

    // Find the correct selectors for chainA and chainB
    const chainASelector = paths[`${chainA} -> ${chainB}`]?.sourceSelector || 
                           paths[`${chainB} -> ${chainA}`]?.destinationSelector || 'N/A';
    const chainBSelector = paths[`${chainB} -> ${chainA}`]?.sourceSelector || 
                           paths[`${chainA} -> ${chainB}`]?.destinationSelector || 'N/A';

    console.log(`Best Pair: ${maxReachPair[0]} can reach ${maxReachPair[1]} chains within ${maxHops} hops.`);

    return {
        bestPair: maxReachPair[0],
        chainASelector,
        chainBSelector,
        reachCount: maxReachPair[1]
    };
}

const maxHops = 2;  
const result = findMaxReachableChains(allShortestPaths, maxHops);

fs.writeFileSync(path.join(__dirname, `../data/max_reachable_chains_${maxHops}_hops.json`), JSON.stringify(result, null, 2));

console.log(`Result saved to 'max_reachable_chains_${maxHops}_hops.json'.`);
