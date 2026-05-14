// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplierRegistry {
    struct Catalog {
        bytes32 ipfsCID;
        uint256 timestamp;
        bool active;
    }

    mapping(address => Catalog) public catalogs;
    event CatalogUpdated(address indexed supplier, bytes32 ipfsCID, uint256 timestamp);

    function updateCatalog(bytes32 _cid) external {
        catalogs[msg.sender] = Catalog(_cid, block.timestamp, true);
        emit CatalogUpdated(msg.sender, _cid, block.timestamp);
    }

    function getLatestCID(address supplier) external view returns (bytes32) {
        require(catalogs[supplier].active, "No active catalog");
        return catalogs[supplier].ipfsCID;
    }
}
