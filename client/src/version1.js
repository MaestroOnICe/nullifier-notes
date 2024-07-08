import React, { useState } from 'react';
import { Lock, Copy, Check } from 'lucide-react';
import CryptoJS from 'crypto-js';

const Version1 = ({ accounts, contract, ethToEurRate, web3, setError }) => {
    const [note, setNote] = useState("");
    const [nullifier, setNullifier] = useState("");
    const [readNullifier, setReadNullifier] = useState("");
    const [readNote, setReadNote] = useState("");
    const [estimatedCost, setEstimatedCost] = useState(null);
    const [noteCopied, setNoteCopied] = useState(false);
    const [nullifierCopied, setNullifierCopied] = useState(false);

    const encryptNote = (note, secretKey) => {
        console.log(note)
        console.log(typeof (note))
        console.log(secretKey)
        console.log(typeof (secretKey))
        return CryptoJS.AES.encrypt(note, secretKey).toString();
    };

    const decryptNote = (encryptedNote, secretKey) => {
        // const secretKey = 'your-secret-key'; // In a real app, manage this securely
        const bytes = CryptoJS.AES.decrypt(encryptedNote, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    };

    const generateNullifier = (note) => {
        const hash = web3.utils.sha3(note + Date.now());
        return hash;
    };

    // handles interaction with the smart contract
    const handleWriteNote = async () => {
        if (!contract || !web3) {
            setError("Web3 instance not found or contract missing")
            return;
        }
        if (note === "") {
            setError("Empty note");
            return;
        }
        try {
            const nullifier = generateNullifier(note);
            // const nullifierBytes32 = web3.utils.padLeft(web3.utils.toHex(nullifier), 64);
            // console.log("Nullifier:", nullifier);
            // console.log("Nullifier in bytes:", nullifierBytes32);

            // console.log("Original note:", note);
            const encryptedNote = encryptNote(note, nullifier);
            // console.log("Encrypted note:", encryptedNote);
            const encryptedNoteBytes = web3.utils.asciiToHex(encryptedNote);
            // console.log("Encrypted note in bytes:", encryptedNoteBytes);

            const result = await contract.methods.storeNote(nullifier, encryptedNoteBytes).send({
                from: accounts[0],
                gas: 200000 // Specify a gas limit
            });
            // console.log("Store note transaction result:", result);

            if (result.events && result.events.NoteStored) {
                // console.log("NoteStored event emitted:", result.events.NoteStored.returnValues);
            } else {
                setError("NoteStored event not found in transaction events");
            }

            // set the nullifier for the user to copy
            setNullifier(nullifier);

            // Log the status of the nullifier
            const isUsed = await contract.methods.isNullifierUsed(nullifier).call();
            // console.log("Nullifier used status after storing note:", isUsed);

            // Verify the note was stored
            const storedNote = await contract.methods.retrieveNote(nullifier).call();
            // console.log("Stored note (should match encryptedNoteBytes):", storedNote);
        } catch (error) {
            setError(`Error writing note: ${error.message || JSON.stringify(error)}`);
        }
    };

    const handleReadNote = async () => {
        if (!contract || !web3) {
            setError("Web3 instance not found or contract missing")
            return;
        }
        if (readNullifier === "") {
            setError("No nullifier entered")
            return
        }
        try {
            // console.log('Nullifier (in byte) to use:', readNullifier);
            // First, check if the nullifier has been used
            const isUsed = await contract.methods.isNullifierUsed(readNullifier).call();
            // console.log('Is nullifier used before retrieval?:', isUsed);
            if (isUsed) {
                setReadNote('This note has already been read.');
                return;
            }

            // Check if the note exists
            const noteExists = await contract.methods.noteExists(readNullifier).call();
            // console.log('Does note exists:', noteExists);
            if (!noteExists) {
                setReadNote('Note does not exist');
                return;
            }

            //TODO FIX this, user can retrieve note without sending the transaction and read note multiple times
            // Try to call the retrieveNote function without sending a transaction
            try {
                const storedNote = await contract.methods.retrieveNote(readNullifier).call();
                // console.log('Stored note retrieved (call):', storedNote);
            } catch (error) {
                // console.log('Error calling retrieveNote:', error.message);
                setError(`Error calling retrieveNote: ${error.message || JSON.stringify(error)}`)
            }

            // Call the retrieveNote function
            const result = await contract.methods.retrieveNote(readNullifier).send({ from: accounts[0] });
            // console.log('Retrieve note transaction result:', result);

            // Check if the transaction was successful
            if (result.status) {
                // Check for the NoteRetrieved event in the transaction events
                if (result.events && result.events.NoteRetrieved) {
                    const encryptedNoteBytes = result.events.NoteRetrieved.returnValues.encryptedNote;
                    // console.log('Encrypted note (in byte) received:', encryptedNoteBytes);

                    const encryptedNote = web3.utils.hexToAscii(encryptedNoteBytes);
                    // console.log('Encrypted note (ASCII):', encryptedNote);
                    const decryptedNote = decryptNote(encryptedNote, readNullifier);
                    // console.log('Decrypted note:', decryptedNote);
                    setReadNote(decryptedNote);
                } else {
                    // console.log('NoteRetrieved event not found in transaction events');
                    setError("NoteRetrieved event not found in transaction events")
                    setReadNote("Note not found");
                }
            } else {
                setReadNote("Transaction failed");
            }

            // Log the status of the nullifier
            const isUsedAfter = await contract.methods.isNullifierUsed(readNullifier).call();
            // console.log("Nullifier used status after retrieving note:, isUsedAfter);
        } catch (error) {
            // console.error("Error reading note:", error);
            setReadNote(`Error: ${error.message || JSON.stringify(error)}`);
        }
    };

    // estimates transaction cost for the note based on eth and gas price
    const estimateTransactionCost = async (noteText) => {
        if (!contract || !web3) return;
        try {
            const nullifier = generateNullifier(noteText);

            const encryptedNote = encryptNote(noteText, nullifier);
            const encryptedNoteBytes = web3.utils.asciiToHex(encryptedNote);

            const gasEstimate = await contract.methods.storeNote(nullifier, encryptedNoteBytes).estimateGas({
                from: accounts[0]
            });

            // get gas price and convert to eth
            const gasPrice = await web3.eth.getGasPrice();
            const estimatedCostWei = gasPrice * gasEstimate;
            const estimatedCostEther = web3.utils.fromWei(estimatedCostWei.toString(), 'ether');
            const estimatedCostEuro = (parseFloat(estimatedCostEther) * ethToEurRate).toFixed(2);

            return { estimatedCostEther, estimatedCostEuro };
        } catch (error) {
            setError(error)
            console.error(`Error estimating transaction cost:  ${error.message || JSON.stringify(error)}`);
            return null;
        }
    };

    // computes estimated price for storing note on the chain
    const handleNoteChange = async (e) => {
        const newNote = e.target.value;
        setNote(newNote);

        if (newNote.trim() !== '') {
            const estimated = await estimateTransactionCost(newNote, ethToEurRate);
            setEstimatedCost(estimated);
        } else {
            setEstimatedCost(null);
        }
    };

    // handle note copy
    const handleNoteCopy = () => {
        navigator.clipboard.writeText(readNote).then(() => {
            setNoteCopied(true);
            setTimeout(() => setNoteCopied(false), 2000); // Reset copied state after 2 seconds
        });
    };

    // handle nullifier copy
    const handleNullifierCopy = () => {
        navigator.clipboard.writeText(nullifier).then(() => {
            setNullifierCopied(true);
            setTimeout(() => setNullifierCopied(false), 2000); // Reset copied state after 2 seconds
        });
    };

    return (
        <main className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold pt-2 mb-6">Write a Note</h2>
            <div className="bg-gray-700 p-2 rounded mb-4">
                <textarea
                    value={note}
                    onChange={handleNoteChange}
                    placeholder="Enter your note here"
                    className="w-full p-2 bg-gray-700 rounded-md text-white"
                    rows="6"
                    style={{ resize: "none" }}
                />
            </div>
            <div className="mb-2">
                <button
                    onClick={handleWriteNote}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md transition-colors flex items-center"
                >
                    <Lock size={16} className="mr-2" /> <span>Encrypt and Store</span>
                </button>
            </div>
            <div className="text-sm text-gray-400 mb-8">
                Estimated cost:
                {estimatedCost ? estimatedCost.estimatedCostEther : '0'} ETH
                ({estimatedCost ? estimatedCost.estimatedCostEuro : '0'} EUR)
            </div>
            <div className="flex items-center bg-gray-700 p-2 rounded mb-8 relative">
                <textarea
                    className="w-full p-2 pr-6 bg-gray-700 rounded-md text-white"
                    value={nullifier || "Nullifier will appear here after executing the smart contract"}
                    style={{ resize: "none" }}
                    readOnly
                />
                <button
                    onClick={handleNullifierCopy}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white"
                    title={nullifierCopied ? "Copied!" : "Copy to clipboard"}
                    disabled={!nullifier}
                >
                    {nullifierCopied ? <Check size={20} /> : <Copy size={20} />}
                </button>
            </div>

            <h2 className="text-2xl font-bold mb-6">Read a Note</h2>
            <div className="flex space-x-2 mb-8">
                <input
                    type="text"
                    value={readNullifier}
                    onChange={(e) => setReadNullifier(e.target.value)}
                    placeholder="Enter nullifier"
                    className="flex-grow p-2 bg-gray-700 rounded-md text-white"
                />
                <button
                    onClick={handleReadNote}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Retrieve Note
                </button>
            </div>
            <div className="flex items-center bg-gray-700 p-2 rounded mb-8 relative">
                <textarea
                    value={readNote}
                    placeholder="Note will appear here..."
                    readOnly
                    className="w-full p-2 pr-6 bg-gray-700 rounded-md text-white"
                    rows="6"
                    style={{ resize: "none" }}
                />
                <button
                    onClick={handleNoteCopy}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white"
                    title={noteCopied ? "Copied!" : "Copy to clipboard"}
                >
                    {noteCopied ? <Check size={20} /> : <Copy size={20} />}
                </button>
            </div>
        </main>
    );
};
export default Version1;