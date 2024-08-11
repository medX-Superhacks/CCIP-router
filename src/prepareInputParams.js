const fs = require('fs');

// Load allShortestPaths from the JSON file
const allShortestPaths = require('../data/all_shortest_paths_with_selectors_and_ccip.json');

function prepareData(to, from, fromChain, toChain, amount, gasLimit) {
    const pathKey = `${fromChain} -> ${toChain}`;
    const pathData = allShortestPaths[pathKey];

    if (!pathData) {
        throw new Error(`No path found between ${fromChain} and ${toChain}`);
    }

    // Check if multiple paths exist, otherwise use the single path
    const paths = pathData.paths || [pathData.path];
    const results = [];

    paths.forEach((fullPath, pathIndex) => {
        // Print the full path including the source chain
        console.log(`Full Path for Path ${pathIndex + 1}:`, fullPath);

        // Skip the first hop (the source chain) and start from the next chain
        const extendedPath = fullPath.slice(1);

        const chainSelectors = extendedPath.map(chain => {
            return allShortestPaths[`${chain} -> ${toChain}`]?.sourceSelector || pathData.destinationSelector;
        });

        const receivers = extendedPath.map((chain, index) => {
            if (index === extendedPath.length - 1) {
                return to; // The last receiver is always the final destination
            }
            return allShortestPaths[`${chain} -> ${toChain}`]?.sourceCCIPRouter || pathData.destinationCCIPRouter;
        });

        const gasLimits = Array(chainSelectors.length).fill(gasLimit);

        const messageData = [
            from,
            to,
            chainSelectors,
            receivers,
            gasLimits,
            amount,
            true, // _nextHop is true until the last chain
            0 // Initial hopIndex is 0
        ];

        const hopDetails = [
            chainSelectors[0],
            receivers[0],
            amount,
            gasLimit
        ];

        results.push({
            path: extendedPath,
            messageData: JSON.stringify(messageData).replace(/\s+/g, ''),
            hopDetails: JSON.stringify(hopDetails).replace(/\s+/g, '')
        });
    });

    return results;
}

// Example usage:
const pathsData = prepareData(
    "0x2cac89ABf06DbE5d3a059517053B7144074e1CE5", 
    "0x2cac89ABf06DbE5d3a059517053B7144074e1CE5",
    "Base Sepolia testnet", 
    "Amoy testnet", 
    "100", 
    "300000"
);

// Print results for each possible path
pathsData.forEach((data, index) => {
    console.log(`\n--- Path ${index + 1} ---`);
    console.log("Message Data:", data.messageData);
    console.log("Hop Details:", data.hopDetails);
    console.log("Path (after skipping the source chain):", data.path);
});
