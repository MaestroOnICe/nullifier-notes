import Web3 from "web3";

const getWeb3 = (providerType) =>
    new Promise((resolve, reject) => {
        console.log(`getWeb3 called with providerType: ${providerType}`);

        const connectMetamask = async () => {
            console.log("Attempting to connect to Metamask");
            if (window.ethereum) {
                const web3 = new Web3(window.ethereum);
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    console.log("Connected to Metamask successfully");
                    resolve(web3);
                } catch (error) {
                    console.error("Error connecting to Metamask:", error);
                    reject(error);
                }
            } else if (window.web3) {
                const web3 = window.web3;
                console.log("Injected web3 detected.");
                resolve(web3);
            } else {
                console.error("No Metamask (or other Web3 provider) installed");
                reject("No Metamask (or other Web3 provider) installed");
            }
        };

        const connectLocalhost = () => {
            console.log("Trying to connect to localhost");
            const provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
            const web3 = new Web3(provider);
            console.log("Using Local web3.");
            resolve(web3);
        };

        const initializeWeb3 = async () => {
            console.log("Window loaded, initializing Web3");
            if (providerType === 'metamask') {
                await connectMetamask();
            } else if (providerType === "localhost") {
                connectLocalhost();
            } else {
                console.error(`Unsupported provider type: ${providerType}`);
                reject(`Unsupported provider type: ${providerType}`);
            }
        };

        if (document.readyState === 'complete') {
            console.log("Document already loaded, initializing immediately");
            initializeWeb3();
        } else {
            console.log("Waiting for window load event");
            window.addEventListener("load", initializeWeb3);
        }
    });
export default getWeb3;