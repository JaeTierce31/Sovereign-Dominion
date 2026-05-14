// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChangeOrderLog {
    struct ChangeOrder {
        bytes32 projectId;
        bytes32 changeHash;
        uint256 timestamp;
        address author;
        string description;
    }

    event OrderChanged(bytes32 indexed projectId, bytes32 changeHash, uint256 timestamp, address author);

    mapping(bytes32 => ChangeOrder[]) public projectChanges;

    function recordChange(bytes32 projectId, bytes32 changeHash, string calldata description) external {
        ChangeOrder memory order = ChangeOrder(projectId, changeHash, block.timestamp, msg.sender, description);
        projectChanges[projectId].push(order);
        emit OrderChanged(projectId, changeHash, block.timestamp, msg.sender);
    }

    function getChanges(bytes32 projectId) external view returns (ChangeOrder[] memory) {
        return projectChanges[projectId];
    }
}
