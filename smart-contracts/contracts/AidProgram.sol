// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract AidProgram {
    struct Program {
        uint256 id;
        string name;
        string description;
        uint256 budget;
        uint256 startDate;
        uint256 endDate;
        bool active;
        address creator;
    }

    uint256 public nextProgramId = 1;
    mapping(uint256 => Program) public programs;
    mapping(uint256 => uint256) public allocatedVoucherCount;

    event ProgramCreated(uint256 indexed programId, address indexed creator, uint256 budget);
    event ProgramClosed(uint256 indexed programId);

    function createProgram(
        string calldata name,
        string calldata description,
        uint256 budget,
        uint256 startDate,
        uint256 endDate
    ) external returns (uint256) {
        require(budget > 0, "budget required");
        require(endDate > startDate, "invalid dates");

        uint256 programId = nextProgramId++;
        programs[programId] = Program({
            id: programId,
            name: name,
            description: description,
            budget: budget,
            startDate: startDate,
            endDate: endDate,
            active: true,
            creator: msg.sender
        });

        emit ProgramCreated(programId, msg.sender, budget);
        return programId;
    }

    function allocateVoucher(uint256 programId, uint256 count) external {
        Program memory program = programs[programId];
        require(program.id != 0, "program missing");
        require(program.active, "program closed");
        require(program.creator == msg.sender, "not owner");
        allocatedVoucherCount[programId] += count;
    }

    function closeProgram(uint256 programId) external {
        Program storage program = programs[programId];
        require(program.id != 0, "program missing");
        require(program.creator == msg.sender, "not owner");
        require(program.active, "already closed");

        program.active = false;
        emit ProgramClosed(programId);
    }
}
