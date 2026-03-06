// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract AidVoucher is ERC1155 {
    enum VoucherStatus {
        Issued,
        Redeemed,
        Expired,
        Cancelled
    }

    struct Voucher {
        uint256 id;
        uint256 programId;
        bytes32 beneficiaryHash;
        uint256 issuedAt;
        uint256 redeemedAt;
        uint256 expiresAt;
        VoucherStatus status;
    }

    uint256 public nextVoucherId = 1;
    mapping(uint256 => Voucher) public vouchers;

    event VoucherIssued(uint256 indexed voucherId, uint256 indexed programId, bytes32 beneficiaryHash);
    event VoucherRedeemed(uint256 indexed voucherId, uint256 redeemedAt);
    event VoucherBurned(uint256 indexed voucherId, address indexed holder, uint256 burnedAt);

    constructor() ERC1155("ipfs://proofaid-voucher/{id}.json") {}

    function issueVoucher(uint256 programId, bytes32 beneficiaryHash, uint256 expiryDays) external returns (uint256) {
        return issueVoucherTo(msg.sender, programId, beneficiaryHash, expiryDays);
    }

    function issueVoucherTo(
        address recipient,
        uint256 programId,
        bytes32 beneficiaryHash,
        uint256 expiryDays
    ) public returns (uint256) {
        require(recipient != address(0), "invalid recipient");
        require(beneficiaryHash != bytes32(0), "invalid beneficiary");
        require(expiryDays > 0, "invalid expiry");

        uint256 voucherId = nextVoucherId++;
        vouchers[voucherId] = Voucher({
            id: voucherId,
            programId: programId,
            beneficiaryHash: beneficiaryHash,
            issuedAt: block.timestamp,
            redeemedAt: 0,
            expiresAt: block.timestamp + (expiryDays * 1 days),
            status: VoucherStatus.Issued
        });

        _mint(recipient, voucherId, 1, "");
        emit VoucherIssued(voucherId, programId, beneficiaryHash);
        return voucherId;
    }

    function redeemVoucher(uint256 voucherId) external {
        Voucher storage voucher = vouchers[voucherId];
        require(voucher.id != 0, "voucher missing");
        require(voucher.status == VoucherStatus.Issued, "already consumed");
        require(balanceOf(msg.sender, voucherId) == 1, "holder required");

        if (block.timestamp > voucher.expiresAt) {
            voucher.status = VoucherStatus.Expired;
            revert("voucher expired");
        }

        _burn(msg.sender, voucherId, 1);
        voucher.status = VoucherStatus.Redeemed;
        voucher.redeemedAt = block.timestamp;
        emit VoucherBurned(voucherId, msg.sender, block.timestamp);
        emit VoucherRedeemed(voucherId, block.timestamp);
    }

    function burnExpiredVoucher(uint256 voucherId) external {
        Voucher storage voucher = vouchers[voucherId];
        require(voucher.id != 0, "voucher missing");
        require(voucher.status == VoucherStatus.Issued, "already consumed");
        require(block.timestamp > voucher.expiresAt, "not expired");
        require(balanceOf(msg.sender, voucherId) == 1, "holder required");

        _burn(msg.sender, voucherId, 1);
        voucher.status = VoucherStatus.Expired;
        emit VoucherBurned(voucherId, msg.sender, block.timestamp);
    }

    // Vouchers are non-transferable. They can only be minted and burned.
    function safeTransferFrom(address, address, uint256, uint256, bytes memory) public pure override {
        revert("voucher non-transferable");
    }

    function safeBatchTransferFrom(address, address, uint256[] memory, uint256[] memory, bytes memory) public pure override {
        revert("voucher non-transferable");
    }
}
