// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract OneTimeNotes {
    mapping(bytes32 => bytes) private notes;
    mapping(bytes32 => bool) private usedNullifiers;

    event NoteStored(bytes32 indexed nullifier);
    event NoteRetrieved(bytes32 indexed nullifier, bytes encryptedNote);

    function storeNote(bytes32 nullifier, bytes memory encryptedNote) public {
        require(!usedNullifiers[nullifier], "Nullifier already used");
        notes[nullifier] = encryptedNote;
        emit NoteStored(nullifier);
    }

    function retrieveNote(bytes32 nullifier) public returns (bytes memory) {
        require(!usedNullifiers[nullifier], "Note already read");
        bytes memory note = notes[nullifier];
        require(note.length > 0, "Note does not exist");
        
        usedNullifiers[nullifier] = true;
        // potentially delete the note
        // delete notes[nullifier];
        emit NoteRetrieved(nullifier, note);
        return note;
    }

    function isNullifierUsed(bytes32 nullifier) public view returns (bool) {
        return usedNullifiers[nullifier];
    }

    function noteExists(bytes32 nullifier) public view returns (bool) {
        return notes[nullifier].length > 0;
    }
}
