# **CCIPMutihop-router**

Welcome to the **CCIP-router** repository. This project demonstrates the implementation of Chainlink's Cross-Chain Interoperability Protocol (CCIP) for executing multi-hop transactions across various testnets. The primary focus is on **MedX** multihop functionality and its evolution into a more advanced approach with **CCIPCrossChainHop**.

---

## **MedX Multihop First Hop**

The **MedX** multihop functionality allows cross-chain transactions starting with a first hop. Below is an example of a transaction on the CCIP network:

- **Transaction:** [MedX Multihop First Hop](https://ccip.chain.link/tx/0x58cfe30b7e0a723b4a5fbe21773a96aa7b22ebd4fd9a2ea31cc3a57a551605c1)

---

## **Contract Evolution: medX to CCIPCrossChainHop**

### **medX Cross-Chain Hop Contract**

The **medX** contract was the initial implementation designed for cross-chain transactions requiring up to one intermediate hop between the source and destination chains. This contract efficiently handles scenarios where a message or asset needs to pass through an intermediate blockchain before reaching its final destination.

#### **Key Features of medX:**

- **Simple Multi-Hop Handling**: The contract is built to handle a single intermediate hop, making it suitable for scenarios where the transaction only requires one intermediary blockchain before reaching the final destination.

- **Gas Limit Management**: The contract allows for specifying gas limits for both the initial hop and the intermediate hop, ensuring sufficient resources are allocated for each transaction.

- **Minimal Complexity**: By focusing on a single hop, the contract is optimized for simplicity and ease of use in cases where complex multi-hop transactions are not required.

#### **Example:**
For a transaction that needs to move from Chain A to Chain C via an intermediate Chain B:
- **medX** handles this efficiently with a single intermediate hop (A -> B -> C).

### **Evolution to CCIPCrossChainHop**

As the need for more complex cross-chain transactions grew, the **medX** approach was extended and evolved into the **CCIPCrossChainHop** contract. This new contract supports transactions that require multiple hops across an arbitrary number of blockchains, making it far more versatile and capable of handling complex scenarios where a message or asset must traverse multiple blockchains before reaching its final destination.

#### **Key Features of CCIPCrossChainHop:**

- **Dynamic Multi-Hop Capability**: The contract can handle multiple hops, making it suitable for transactions that need to traverse several blockchains before reaching their destination.

- **Scalability**: The design allows for scaling to support an arbitrary number of chains, making it a robust solution for more complex cross-chain operations.

- **Extended Gas Management**: Similar to medX, this contract manages gas limits for each hop, but it extends this capability to handle multiple hops, ensuring that each step of the transaction is adequately funded.

- **Versatile Use Cases**: The contract is designed to be adaptable to various scenarios, from simple one-hop transactions to complex multi-hop transactions involving multiple intermediary blockchains.

#### **Example:**
For a transaction that needs to move from Chain A to Chain D via two intermediate chains B and C (due to lanes doesnt exists between A<-->D):
- **CCIPCrossChainHop** effectively handles the full path (A -> B -> C -> D) and can be extended to even more hops if needed (A -> B -> C -> D -> … -> N).

---

## **Graph Creation and Shortest Path Finding**

To manage and optimize cross-chain transactions, a graph was created where each node represents a testnet chain and each edge represents a possible lane for CCIP transactions between these chains. 

### **Using Dijkstra's Algorithm**

Dijkstra's algorithm was utilized to find the shortest paths between different testnet chains. This allows the contracts to efficiently determine the optimal route for cross-chain messages, ensuring that transactions are completed in the shortest time possible while minimizing gas costs. The helper script processes this graph to generate the necessary input parameters for executing multi-hop transactions.

---

## **Helper Script: Input Parameters Generation**

### **prepareData Function**

The `prepareData` function is an integral part of this project, responsible for dynamically generating the input parameters required for multi-hop transactions. Here's how it works:

- **From and To Addresses:** These parameters define the sender and receiver addresses. The receiver address is updated at each hop to ensure the message is correctly routed.

- **Chain Selectors:** The function maps the chain selectors for each blockchain in the path, allowing the contract to identify which blockchain to forward the message to.

- **Gas Limits:** Gas limits are provided for each hop, ensuring that each transaction has sufficient gas to complete on each blockchain.

- **Amount:** The amount of the transaction, usually in USDC or another stablecoin, is specified for each hop.

### **Multiple Paths:**

In cases where multiple paths exist between two chains, the helper function generates data for each path, allowing the contract to choose the most optimal path. Each path's message data and hop details are logged for reference.

---

## **Medx Single Hop**

Here are the contract addresses for different testnets involved in the medx singlehop functionality:

### **Sepolia Testnet**
- **Contract Address:** [0x98e7375398DE78FcFA685204D219A1571B888535](https://sepolia.etherscan.io/address/0x98e7375398DE78FcFA685204D219A1571B888535)

### **Base Sepolia Testnet**
- **Contract Address:** [0xc1ca35997dd2c981c7ade0c73bd8628079fd0a4e](https://sepolia.basescan.org/address/0xc1ca35997dd2c981c7ade0c73bd8628079fd0a4e)

### **Optimism Sepolia Testnet**
- **Contract Address:** [0x309222b7833D3D0A59A8eBf9C64A5790bf43E2aA](https://sepolia-optimism.etherscan.io/address/0x309222b7833D3D0A59A8eBf9C64A5790bf43E2aA)

### **Polygon Amoy Testnet**
- **Contract Address:** [0x7A409A3A36112bd6906a113d9612D7f7e1abd6d4](https://amoy.polygonscan.com/address/0x7A409A3A36112bd6906a113d9612D7f7e1abd6d4)

---

## **Medx Onchain Autopay with Functions ntfn**

- **Contract Address:** [0xF8539a832FFc12e0adc615c5759cD675Daa49Ca5](https://sepolia.basescan.org/address/0xF8539a832FFc12e0adc615c5759cD675Daa49Ca5)

---

## **CCIP Multichain Hop Router**

The following are the **CCIP Multichain Hop Router** contract addresses deployed across different testnets:

### **Base Sepolia Testnet**
- **Router Address:** [0x273C282A9f1B45416CB9967611d431C116286ef9](https://sepolia.basescan.org/address/0x273C282A9f1B45416CB9967611d431C116286ef9#code)

### **Sepolia Testnet**
- **Router Address:** [0x96EE5fb7bc57C1f03D560Fcb1b8574ddC8bf5F37](https://sepolia.etherscan.io/address/0x96EE5fb7bc57C1f03D560Fcb1b8574ddC8bf5F37)

### **Optimism Sepolia Testnet**
- **Router Address:** [0xF99b791257ab50be7F235BC825E7d4B83942cf38](https://sepolia-optimism.etherscan.io/address/0xF99b791257ab50be7F235BC825E7d4B83942cf38)

### **Amoy Testnet**
- **Router Address:** [0x40Fee4c8A3a66Dba113b881Dca0E4B2828b86BB7](https://amoy.polygonscan.com/address/0x40Fee4c8A3a66Dba113b881Dca0E4B2828b86BB7)

### **Arbitrum Sepolia Testnet**
- **Router Address:** [0x309222b7833D3D0A59A8eBf9C64A5790bf43E2aA](https://sepolia.arbiscan.io/address/0x309222b7833D3D0A59A8eBf9C64A5790bf43E2aA)

---

## **Transaction Examples**

Here are some examples of multi-hop transactions executed across various testnets:

- **Base ➡ Optimism ➡ Amoy**
  - **Transaction:** [CCIP Multi-Hop](https://ccip.chain.link/tx/0xe6e1effa58c4d081159a3fa2d567d52364218f1b748a696adac6ff16732ae02b)

- **Base ➡ Optimism ➡ Sepolia ➡ Amoy**
  - **Transaction Optimism --> Sepolia :** [CCIP Multi-Hop](https://ccip.chain.link/tx/0x1213cfb14f128a2a0468b0b848e9dacb2e8a359364a8b9d16666f7d2a8dc6f53)
  - **Transaction Sepolia --> Amoy :** [CCIP Multi-Hop](https://ccip.chain.link/tx/0xd24a66d5ed53a4bada1fe4bc8a31a22a7867220e8cc652e885834da0fe304bfe)
---

## **Repository Structure**

This repository contains:

- **Smart Contracts**: Contracts implementing the CCIP functionality for multi-hop transactions.
- **Helper Scripts**: Scripts for generating input parameters and testing various transaction paths.
- **Documentation**: Detailed explanations of the contract functionality, use cases, and examples.

---

## **Contributing**

Feel free to open issues or submit pull requests if you find any bugs or want to contribute new features or enhancements.

---

## **License**

This project is licensed under the MIT License.
