// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract BeneficiaryRegistry {
    struct Beneficiary {
        bytes32 identityHash;
        uint256 programId;
        uint256 createdAt;
        bool active;
    }

    mapping(bytes32 => Beneficiary) public beneficiaries;

    event BeneficiaryRegistered(bytes32 indexed identityHash, uint256 indexed programId);

    function registerBeneficiary(bytes32 identityHash, uint256 programId) external {
        require(identityHash != bytes32(0), "invalid hash");
        require(beneficiaries[identityHash].createdAt == 0, "already exists");

        beneficiaries[identityHash] = Beneficiary({
            identityHash: identityHash,
            programId: programId,
            createdAt: block.timestamp,
            active: true
        });

        emit BeneficiaryRegistered(identityHash, programId);
    }
}
