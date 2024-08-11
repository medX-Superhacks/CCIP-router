// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract Autopay is ReentrancyGuard, AutomationCompatibleInterface, Ownable, FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    uint256 public s_subscriptionId=154;


    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    string public lastConfirmationMsg;

    error UnexpectedRequestID(bytes32 requestId);

    struct Treatment {
        address patient;
        address doctor;
        uint256 startTime;
        uint256 endTime;
        uint256 finalEndTime;
        uint256 interval;
        uint256 cost;
        uint256 ntfnAttempts;
        bool isActive;
    }

    mapping(uint256 => Treatment) public treatments; // Mapping from ID to treatment details
    uint256 public nextTreatmentId;

    event TreatmentScheduled(uint256 indexed treatmentId, address indexed patient, address indexed doctor, uint256 startTime, uint256 endTime, uint256 finalEndTime, uint256 interval);
    event TreatmentUpdated(uint256 indexed treatmentId, uint256 newEndTime);
    event TreatmentStopped(uint256 indexed treatmentId);

    event UnexpectedRequestIDError(bytes32 indexed requestId);
    event DecodingFailed(bytes32 indexed requestId);
    event ResponseError(bytes32 indexed requestId, bytes err);
    event Response(bytes32 indexed requestId, string response, bytes err);

    address router = 0xf9B8fc078197181C841c296C876945aaa425B278;
    string source = 
        "const patientAddress = args[0];"
        "const doctorAddress = args[1];"
        "const url = `https://chainlink-ntfn-service-medx.onrender.com/send-email`;"
        "console.log(`HTTP GET Request to ${url}?patientAddress=${patientAddress}&doctorAddress=${doctorAddress}`);"
        "const emailRequest = Functions.makeHttpRequest({"
        "  url: url,"
        "  headers: {"
        "    'Content-Type': 'application/json',"
        "  },"
        "  timeout: 9000,"
        "  params: {"
        "    patientAddress: patientAddress,"
        "    doctorAddress: doctorAddress,"
        "  },"
        "});"
        "const emailResponse = await emailRequest;"
        "return Functions.encodeString(`Notified Patient with ${patientAddress} & Doctor ${doctorAddress}`);";

    uint32 gasLimit = 300_000;
    bytes32 donID = 0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000;

    IERC20 public paymentToken;


    constructor(address _paymentToken)FunctionsClient(router) Ownable(_msgSender()) {
        paymentToken = IERC20(_paymentToken);
    }


    function scheduleTreatment(
        address patient,
        address doctor,
        uint256 duration,
        uint256 totalDuration,
        uint256 interval,
        uint256 cost  // New cost parameter
    ) external returns (uint256 treatmentId) {
        treatmentId = nextTreatmentId++;
        uint256 startTime = block.timestamp;
        uint256 endTime = block.timestamp + duration;
        uint256 finalEndTime = block.timestamp + totalDuration;

        treatments[treatmentId] = Treatment(patient, doctor, startTime, endTime, finalEndTime, interval, cost, 0, true);

        emit TreatmentScheduled(treatmentId, patient, doctor, startTime, endTime, finalEndTime, interval);
    }


    function extendTreatment(uint256 treatmentId) public  {
        Treatment storage treatment = treatments[treatmentId];
        require(treatment.isActive, "Treatment is not active");

        uint256 newEndTime = treatment.endTime + treatment.interval;
        if (newEndTime > treatment.finalEndTime) {
            treatment.isActive = false;
            emit TreatmentStopped(treatmentId);
        } else {
            treatment.endTime = newEndTime;
            emit TreatmentUpdated(treatmentId, newEndTime);
        }
    }

    function checkUpkeep(bytes calldata) view  external override returns (bool upkeepNeeded, bytes memory performData) {
        uint256[] memory dueTreatments = new uint256[](nextTreatmentId);
        uint256 count = 0;

        for (uint256 i = 0; i < nextTreatmentId; i++) {
            Treatment memory treatment = treatments[i];
            if (treatment.endTime <= block.timestamp && treatment.isActive && treatment.endTime < treatment.finalEndTime) {
                dueTreatments[count] = i;
                count++;
            }
        }

        if (count > 0) {
            bytes memory data = abi.encode(dueTreatments);
            return (true, data);
        }

        return (false, "");
    }

    function performUpkeep(bytes calldata performData) external override {
        uint256[] memory expiredTokenIds = abi.decode(performData, (uint256[]));

        for (uint256 i = 0; i < expiredTokenIds.length; i++) {
            uint256 tokenId = expiredTokenIds[i];
            Treatment storage treatment = treatments[tokenId];

            if (paymentToken.balanceOf(treatment.patient) >= treatment.cost && paymentToken.allowance(treatment.patient, address(this)) >= treatment.cost) {
                require(paymentToken.transferFrom(treatment.patient, treatment.doctor, treatment.cost));
                treatment.endTime = block.timestamp + treatment.interval;
            } else {
                treatment.ntfnAttempts++;
                if (treatment.ntfnAttempts >= 2) {
                    treatment.isActive = false;
                }

                string[] memory args = new string[](2);
                args[0] = toAsciiString(treatment.patient);
                args[1] = toAsciiString(treatment.doctor);

                sendRequest(154, args);
            }
        }
    }


    function sendRequest(uint64 subscriptionId, string[] memory args) public returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (args.length > 0) req.setArgs(args);
        s_lastRequestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donID);
        return s_lastRequestId;
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (s_lastRequestId != requestId) {
            emit Response(requestId, string(response), err);
            return;
        }
        s_lastResponse = response;
        s_lastError = err;
        lastConfirmationMsg = string(response);
        emit Response(requestId, lastConfirmationMsg, s_lastError);
    }

  
    function updatePaymentToken(address newPaymentTokenAddress) public onlyOwner {
        require(newPaymentTokenAddress != address(0), "Invalid address");
        paymentToken = IERC20(newPaymentTokenAddress);
    }

    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    function uintToString(uint v) internal pure returns (string memory) {
        if (v == 0) {
            return "0";
        }
        uint j = v;
        uint length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint k = length;
        while (v != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(v - v / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            v /= 10;
        }
        return string(bstr);
    }
}