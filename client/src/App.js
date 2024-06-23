import React, { useState, useEffect } from 'react';
import SecureNotesContract from './contracts/OneTimeNotes.json';
import getWeb3 from './getWeb3';
import CryptoJS from 'crypto-js';
import './App.css';

function App() {
  const [note, setNote] = useState('');
  const [nullifier, setNullifier] = useState('');
  const [readNullifier, setReadNullifier] = useState('');
  const [readNote, setReadNote] = useState('');
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Get network provider and web3 instance
        const web3 = await getWeb3();

        // Use web3 to get the user's accounts
        const accounts = await web3.eth.getAccounts();

        // Get the contract instance
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = SecureNotesContract.networks[networkId];

        if (!deployedNetwork) {
          throw new Error(`Contract not deployed on network ${networkId}`);
        }

        const instance = new web3.eth.Contract(
          SecureNotesContract.abi,
          deployedNetwork && deployedNetwork.address,
        );

        console.log('Contract address:', deployedNetwork.address);
        console.log('Connected account:', accounts[0]);

        setWeb3(web3);
        setAccounts(accounts);
        setContract(instance);
      } catch (error) {
        alert('Failed to load web3, accounts, or contract. Check console for details.');
        console.error(error);
      }
    };
    init();
  }, []);

  const encryptNote = (note) => {
    const secretKey = 'your-secret-key'; // In a real app, manage this securely
    return CryptoJS.AES.encrypt(note, secretKey).toString();
  };

  const decryptNote = (encryptedNote) => {
    const secretKey = 'your-secret-key'; // In a real app, manage this securely
    const bytes = CryptoJS.AES.decrypt(encryptedNote, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  const generateNullifier = (note) => {
    const hash = web3.utils.sha3(note + Date.now());
    return hash;
  };

  const handleWriteNote = async () => {
    if (!contract || !web3) return;
    try {
      const encryptedNote = encryptNote(note)
      const encryptedNoteBytes = web3.utils.asciiToHex(encryptedNote);

      const nullifier = generateNullifier(note);
      const nullifierBytes32 = web3.utils.padLeft(web3.utils.toHex(nullifier), 64);

      console.log('Nullifier (in byte) generated:', nullifierBytes32);
      console.log('Encrypted Note to store (in byte):', encryptedNoteBytes);

      await contract.methods.storeNote(nullifierBytes32, encryptedNoteBytes).send({
        from: accounts[0],
        gas: 200000 // Specify a gas limit
      });
      setNullifier(nullifierBytes32);
    } catch (error) {
      console.error("Error writing note:", error);
    }
  };

  const handleReadNote = async () => {
    if (!contract || !web3) return;
    try {
      //const nullifierBytes32 = web3.utils.padLeft(web3.utils.toHex(readNullifier), 64);
      console.log('Nullifier (in byte) to use:', readNullifier);

      const encryptedNoteBytes = await contract.methods.retrieveNote(readNullifier).call({ from: accounts[0] });
      console.log('Encrypted note (in byte) received:', encryptedNoteBytes);
      const encryptedNote = web3.utils.hexToAscii(encryptedNoteBytes);
      const decryptedNote = decryptNote(encryptedNote);
      setReadNote(decryptedNote);
    } catch (error) {
      console.error("Error reading note:", error);
    }
  };

  if (!web3) {
    return <div>Loading Web3, accounts, and contract...</div>;
  }

  return (
    <div className="App">
      <h1>Secure Note DApp</h1>

      <div>
        <h2>Write a Note</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter your note here"
        />
        <button onClick={handleWriteNote}>Encrypt and Store</button>
        {nullifier && <p>Nullifier: {nullifier}</p>}
      </div>

      <div>
        <h2>Read a Note</h2>
        <input
          value={readNullifier}
          onChange={(e) => setReadNullifier(e.target.value)}
          placeholder="Enter nullifier"
        />
        <button onClick={handleReadNote}>Retrieve Note</button>
        {readNote && <p>Retrieved Note: {readNote}</p>}
      </div>
    </div>
  );
}

export default App;