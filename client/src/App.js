import React, { useState, useEffect } from 'react';
import SecureNotesContract from './contracts/OneTimeNotes.json';
import getWeb3 from './getWeb3.js';
import Version1 from "./version1.js"
import Version2 from "./version2.js"
import ErrorPopup from './ErrorPopup.js';
import SuccessPopup from './SuccessPopup.js';
import Modal from './Modal.js'
import { Lock } from 'lucide-react';
import './App.css';

function App() {

  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [contract, setContract] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [ethToEurRate, setEthToEurRate] = useState(1);
  const navItems = [
    { id: 'v1', label: 'Version 1', component: Version1, props: { accounts: accounts, contract: contract, ethToEurRate: ethToEurRate, web3: web3, setError: setError } },
    { id: 'v2', label: 'Version 2', component: Version2 },
  ];
  const [activeNav, setActiveNav] = useState(navItems[0].id);

  useEffect(() => {
    const init = async () => {
      try {
        // fetch eth price
        fetchEthToEurRate();

      } catch (error) {
        setError('Failed init the DApp.');
        //console.error(error);
      }
    };
    init();
  }, []);

  // fetches eth euro rate for estimated cost
  const fetchEthToEurRate = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur');
      const data = await response.json();
      setEthToEurRate(data.ethereum.eur);
    } catch (error) {
      setError("Error fetching ETH to EUR rate from coingecko:', error")
    }
  };


  const connectToProvider = async (providerType) => {
    try {
      // Get network provider and web3 instance
      console.log("Calling getWeb3");
      const web3Instance = await getWeb3(providerType);
      console.log("getWeb3 returned successfully", web3Instance);

      // Get network provider and web3 instance
      const accounts = await web3Instance.eth.getAccounts();

      // Get the contract instance
      const networkId = await web3Instance.eth.net.getId();
      const deployedNetwork = SecureNotesContract.networks[networkId];

      if (!deployedNetwork) {
        setError(`Contract not deployed on network ${networkId}`);
      }

      const contractInstance = new web3Instance.eth.Contract(
        SecureNotesContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      console.log('Contract address:', deployedNetwork.address);
      console.log('Connected account:', accounts[0]);

      setWeb3(web3Instance);
      setAccounts(accounts);
      setContract(contractInstance)
      setIsModalOpen(false);
      setIsWalletConnected(true)

      console.log(`Connected to ${providerType} with address: ${accounts[0]}`);
      setMsg("Connected")
    } catch (error) {
      console.error('Error connecting to provider:', error);
      setError('Error connecting to provider:', error)
    }
  };


  const handelConnect = () => {
    setIsModalOpen(true);
  };

  const handleConnectionSelect = (option) => {
    console.log(`Selected connection: ${option}`);
    connectToProvider(option)
  };


  const activeItem = navItems.find(item => item.id === activeNav) || navItems[0];
  const ActiveComponent = activeItem.component;

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
      {msg && <SuccessPopup message={msg} onClose={() => setMsg(null)} />}
      <header className="flex justify-between items-center p-4 border-b border-gray-800">
        <div className="flex items-center space-x-6">
          <div className="text-purple-500 font-bold text-xl">
            <Lock size={24} />
          </div>
          <nav className="flex space-x-4 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`hover:text-gray-300 whitespace-nowrap ${activeNav === item.id ? 'text-blue-400' : ''
                  }`}
                onClick={() => setActiveNav(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handelConnect}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors"
          >
            {isWalletConnected ? "Connected" : "Connect"}
          </button>
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4">
        <ActiveComponent {...activeItem.props} />
      </main>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleConnectionSelect}
      />
    </div>
  );
};

export default App;