// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract DistributionEvent {
    struct EventRecord {
        uint256 id;
        uint256 programId;
        uint256 voucherId;
        bytes32 beneficiaryHash;
        uint256 timestamp;
        string status;
    }

    uint256 public nextEventId = 1;
    mapping(uint256 => EventRecord) public eventsById;

    event DistributionRecorded(uint256 indexed eventId, uint256 indexed voucherId, string status);

    function recordDistribution(
        uint256 programId,
        uint256 voucherId,
        bytes32 beneficiaryHash,
        string calldata status
    ) external returns (uint256) {
        uint256 eventId = nextEventId++;

        eventsById[eventId] = EventRecord({
            id: eventId,
            programId: programId,
            voucherId: voucherId,
            beneficiaryHash: beneficiaryHash,
            timestamp: block.timestamp,
            status: status
        });

        emit DistributionRecorded(eventId, voucherId, status);
        return eventId;
    }
}
