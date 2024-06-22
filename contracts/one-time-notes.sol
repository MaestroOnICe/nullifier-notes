// SPDX-License-Identifier: MIT
// Smart Contract (Solidity)

pragma solidity ^0.8.19;
contract OneTimeNotes {
    mapping(bytes32 => bytes) private notes;
    mapping(bytes32 => bool) private usedNullifiers;

    function storeNote(bytes32 nullifier, bytes memory encryptedNote) public {
        require(!usedNullifiers[nullifier], "Nullifier already used");
        notes[nullifier] = encryptedNote;
    }

    function retrieveNote(bytes32 nullifier) public returns (bytes memory) {
        require(!usedNullifiers[nullifier], "Note already read");
        usedNullifiers[nullifier] = true;
        return notes[nullifier];
    }
}
