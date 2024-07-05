import React, { useState, useEffect } from 'react';
import SecureNotesContract from './contracts/OneTimeNotes.json';
import getWeb3 from './getWeb3.js';
import Version1 from "./version1.js"
import Version2 from "./version2.js"
import ErrorPopup from './ErrorPopup.js';
import { Lock } from 'lucide-react';
import './App.css';

function App() {

  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [ethToEurRate, setEthToEurRate] = useState(0);
  const navItems = [
    { id: 'v1', label: 'Version 1', component: Version1, props: { accounts: accounts, contract: contract, ethToEurRate: ethToEurRate, web3: web3, setError: setError } },
    { id: 'v2', label: 'Version 2', component: Version2 },
  ];
  const [activeNav, setActiveNav] = useState(navItems[0].id);

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
          setError(`Contract not deployed on network ${networkId}`);
          //console.log(`Contract not deployed on network ${networkId}`)
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

        // fetch eth price
        fetchEthToEurRate();

      } catch (error) {
        setError('Failed to load web3, accounts, or contract. Check console for details.');
        console.error(error);
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
      //setError("Error fetching ETH to EUR rate from coingecko:', error")
    }
  };

  // handles metamask connection
  const handleConnectWallet = () => {
    setIsWalletConnected(true);
    setError("Done")
  };




  if (!web3) {
    return <div>Loading Web3, accounts, and contract...</div>;
  }

  const activeItem = navItems.find(item => item.id === activeNav) || navItems[0];
  const ActiveComponent = activeItem.component;

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
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
            onClick={handleConnectWallet}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors"
          >
            {isWalletConnected ? "Connected" : "Connect"}
          </button>
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4">
        <ActiveComponent {...activeItem.props} />
      </main>
    </div>
  );
};

export default App;