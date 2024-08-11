// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";

contract CCIPCrossChainHop is CCIPReceiver {

    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        string text,
        address token,
        uint256 tokenAmount,
        address feeToken,
        uint256 fees
    );

    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);

    bytes32 public s_lastRequestId;

    IRouterClient private s_router;
    LinkTokenInterface private s_linkToken;
    address public owner;
    IERC20 public stablecoin;

    struct HopDetails {
        uint64 destinationChainSelector;
        address receiver;
        uint256 amount;
        uint32 gasLimit;
    }

    struct MessageData {
        address _from;
        address _to;
        uint64[] chainSelectors;
        address[] receivers;
        uint32[] gasLimits;
        uint256 _amount;
        bool _nextHop;
        uint256 hopIndex;
    }

    constructor(address _router, address _link, address _stablecoinAddress)CCIPReceiver(_router) {
        stablecoin = IERC20(_stablecoinAddress);
        s_router = IRouterClient(_router);
        s_linkToken = LinkTokenInterface(_link);
    }

    function sendUsdcMultiHop(
        HopDetails memory hop,
        MessageData memory messageData
    ) public returns (bytes32 messageId) {
        bytes memory data = abi.encode(
            messageData._from,
            messageData._to,
            messageData.chainSelectors,
            messageData.receivers,
            messageData.gasLimits,
            messageData._amount,
            messageData._nextHop,
            messageData.hopIndex
        );

        Client.EVM2AnyMessage memory evm2AnyMessage = _createCCIPMessage(
            hop.receiver,
            data,
            hop.amount,
            hop.gasLimit
        );

        uint256 fees = s_router.getFee(hop.destinationChainSelector, evm2AnyMessage);
        if (fees > s_linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);

        _approveTokens(fees, hop.amount);

        messageId = s_router.ccipSend(hop.destinationChainSelector, evm2AnyMessage);

        emit MessageSent(
            messageId,
            hop.destinationChainSelector,
            hop.receiver,
            "CCIP MultiChain Hop",
            address(stablecoin),
            hop.amount,
            address(s_linkToken),
            fees
        );

        return messageId;
    }

    function _createCCIPMessage(
        address _receiver,
        bytes memory data,
        uint256 _amount,
        uint32 _gasLimit
    ) private view returns (Client.EVM2AnyMessage memory) {
         Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: address(stablecoin),
            amount: _amount
        });

        return Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: data,
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: _gasLimit})),
            feeToken: address(s_linkToken)
        });
    }

    function _approveTokens(uint256 fees, uint256 amount) private {
        s_linkToken.approve(address(s_router), fees);
        stablecoin.approve(address(s_router), amount);
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        MessageData memory messageData;
        (
            messageData._from,
            messageData._to,
            messageData.chainSelectors,
            messageData.receivers,
            messageData.gasLimits,
            messageData._amount,
            messageData._nextHop,
            messageData.hopIndex
        ) = abi.decode(message.data, (address, address, uint64[], address[], uint32[], uint256, bool, uint256));

        if (messageData._nextHop && messageData.hopIndex < messageData.chainSelectors.length - 1) {
            HopDetails memory nextHopDetails = HopDetails({
                destinationChainSelector: messageData.chainSelectors[messageData.hopIndex + 1],
                receiver: messageData.receivers[messageData.hopIndex + 1],
                amount: messageData._amount,
                gasLimit: messageData.gasLimits[messageData.hopIndex + 1]
            });

            sendUsdcMultiHop(
                nextHopDetails,
                MessageData({
                    _from: messageData._from,
                    _to: messageData._to,
                    chainSelectors: messageData.chainSelectors,
                    receivers: messageData.receivers,
                    gasLimits: messageData.gasLimits,
                    _amount: messageData._amount,
                    _nextHop: messageData.hopIndex + 1 < messageData.chainSelectors.length - 1,
                    hopIndex: messageData.hopIndex + 1
                })
            );
        } else {
            // The flow stops here on the last Blockchain (e.g., Blockchain D)
           
        }
    }
}
