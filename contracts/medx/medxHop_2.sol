// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {IAny2EVMMessageReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IAny2EVMMessageReceiver.sol";

contract medxCrossChainHop is IAny2EVMMessageReceiver {

   // Event emitted when a message is sent to another chain.
    event MessageSent(
        bytes32 indexed messageId, // The unique ID of the CCIP message.
        uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
        address receiver, // The address of the receiver on the destination chain.
        string text, // The text being sent.
        address token, // The token address that was transferred.
        uint256 tokenAmount, // The token amount that was transferred.
        address feeToken, // the token address used to pay CCIP fees.
        uint256 fees // The fees paid for sending the message.
    );

    // Custom errors to provide more descriptive revert messages.
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); // Used to make sure contract has enough balance to cover the fees.

    bytes32 public s_lastRequestId;

    IRouterClient private s_router;

    LinkTokenInterface private s_linkToken;

    address public owner;
    IERC20 public stablecoin;

    constructor(address _router, address _link, address _stablecoinAddress) {
        stablecoin = IERC20(_stablecoinAddress);
        s_router = IRouterClient(_router);
        s_linkToken = LinkTokenInterface(_link);
    }
    
    /// @notice Sends data and transfers tokens to receiver on the destination chain.
    /// @notice Pay for fees in LINK.
    /// @param _destinationChainSelector The identifier (aka selector) for the destination blockchain.
    /// @param _receiver The address of the deployed contract on the destination blockchain.
    /// @param _amount Amount of the token for the subscription.
    /// @return messageId The ID of the CCIP message that was sent.
    function sendUsdcMultiHop(
        uint64 _destinationChainSelector,
        uint64 _hopDestinationChainSelector,
        bool _nextHop,
        address _receiver,
        address _to,
        address _from,
        uint256 _amount,
        uint32 _gasLimit,
        uint32 _hopGasLimit
    ) public returns (bytes32 messageId) {
        // Transfer the amount to contract 
        require(stablecoin.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        // Encode the receiver address and amount for the message
        bytes memory data = abi.encode(_from,_to,_hopDestinationChainSelector,_nextHop,_amount,_hopGasLimit);

        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            data,
            address(stablecoin),
            _amount,
            address(s_linkToken),
            _gasLimit
        );

        uint256 fees = s_router.getFee(_destinationChainSelector, evm2AnyMessage);
        if (fees > s_linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);

        s_linkToken.approve(address(s_router), fees);
        stablecoin.approve(address(s_router), _amount);

        messageId = s_router.ccipSend(_destinationChainSelector, evm2AnyMessage);

        emit MessageSent(
            messageId,
            _destinationChainSelector,
            _receiver,
            "Initiating Consultation Purchase",
            address(stablecoin),
            _amount,
            address(s_linkToken),
            fees
        );

        return messageId;
    }

    /// @notice Construct a CCIP message.
    /// @param _receiver The address of the destination contract.
    /// @param data The encoded data for the contract function call.
    /// @param _token The token to be transferred.
    /// @param _amount The amount of the token to be transferred.
    /// @param _feeTokenAddress The address of the token used for fees.
    /// @return Client.EVM2AnyMessage Returns an EVM2AnyMessage struct which contains information for sending a CCIP message.
    function _buildCCIPMessage(
        address _receiver,
        bytes memory data,
        address _token,
        uint256 _amount,
        address _feeTokenAddress,
        uint32 _gasLimit
    ) private pure returns (Client.EVM2AnyMessage memory) {
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: _token,
            amount: _amount
        });

        return Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: data,
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: _gasLimit})),
            feeToken: _feeTokenAddress
        });
    }

    /// @inheritdoc IAny2EVMMessageReceiver
    function ccipReceive(Client.Any2EVMMessage calldata message)
        external
        virtual
        override
    {
        // Decode the message data
        (address _from, address _to, uint64 _hopDestinationChainSelector, bool _nextHop, uint256 _amount, uint32 _hopGasLimit) =
            abi.decode(message.data, (address, address, uint64, bool, uint256, uint32));

        // Check if there is a next hop
        if (_nextHop) {
            sendUsdcMultiHop(_hopDestinationChainSelector, _hopDestinationChainSelector, false, _to, _to, _from, _amount, _hopGasLimit, _hopGasLimit);
        } else {
            
        }
    }
}