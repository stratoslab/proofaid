// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract AidVoucher {
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

    function issueVoucher(uint256 programId, bytes32 beneficiaryHash, uint256 expiryDays) external returns (uint256) {
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

        emit VoucherIssued(voucherId, programId, beneficiaryHash);
        return voucherId;
    }

    function redeemVoucher(uint256 voucherId) external {
        Voucher storage voucher = vouchers[voucherId];
        require(voucher.id != 0, "voucher missing");
        require(voucher.status == VoucherStatus.Issued, "already consumed");

        if (block.timestamp > voucher.expiresAt) {
            voucher.status = VoucherStatus.Expired;
            revert("voucher expired");
        }

        voucher.status = VoucherStatus.Redeemed;
        voucher.redeemedAt = block.timestamp;
        emit VoucherRedeemed(voucherId, block.timestamp);
    }
}
