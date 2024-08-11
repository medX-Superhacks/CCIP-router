const fs = require('fs');

const chainData = {
    "Amoy testnet": {
        selector: "16281711391670634445",
        ccipMultiHopRouter: "0x40Fee4c8A3a66Dba113b881Dca0E4B2828b86BB7"
    },
    "Optimism Sepolia testnet": {
        selector: "5224473277236331295",
        ccipMultiHopRouter: "0xF99b791257ab50be7F235BC825E7d4B83942cf38"
    },
    "Base Sepolia testnet": {
        selector: "10344971235874465080",
        ccipMultiHopRouter: "0x273C282A9f1B45416CB9967611d431C116286ef9"
    },
    "Sepolia testnet": {
        selector: "16015286601757825753",
        ccipMultiHopRouter: "0x96EE5fb7bc57C1f03D560Fcb1b8574ddC8bf5F37"
    }
};

function prepareCustomData(to, from, amount, gasLimit) {
    const extendedPath = [
        "Optimism Sepolia testnet",
        "Sepolia testnet",
        "Amoy testnet"
    ];

    const chainSelectors = extendedPath.map(chain => chainData[chain]?.selector);

    const receivers = extendedPath.map((chain, index) => {
        if (index === extendedPath.length - 1) {
            return to; // The last receiver is always the final destination
        }
        return chainData[chain]?.ccipMultiHopRouter;
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

    return {
        path: extendedPath,
        messageData: JSON.stringify(messageData).replace(/\s+/g, ''),
        hopDetails: JSON.stringify(hopDetails).replace(/\s+/g, '')
    };
}

// Example usage:
const customPathData = prepareCustomData(
    "0x2cac89ABf06DbE5d3a059517053B7144074e1CE5", // To
    "0x2cac89ABf06DbE5d3a059517053B7144074e1CE5", // From
    "100",  // Amount
    "300000" // Gas Limit
);

console.log("Message Data:", customPathData.messageData);
console.log("Hop Details:", customPathData.hopDetails);
console.log("Path:", customPathData.path);
