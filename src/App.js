import './App.css';
import { useState, useEffect, useRef } from "react";
import { ethers } from 'ethers'
import SCA from './artifacts/contracts/SCA.sol/SCA.json'
import { create as ipfsHttpClient } from "ipfs-http-client";


// Update with the contract address after deploying the smart contract  
const scaAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

// insert your infura project credientals
const projectId = "2DxpAMDUxnEwmX2dp5U3YrLjlRZ"
const projectSecretKey = "2a7dbfdfb1d708794a3b7a1c4bac0e4e"
const authorization = "Basic " + btoa(projectId + ":" + projectSecretKey);


function App() {

  const [biddoc, setBiddoc] = useState('');
  const [carrier, setCarrier] = useState([]);
  const [cid, setCid] = useState();
  const resultBox = useRef();
const [signatures, setSignatures] = useState();
const [error, setError] = useState();
let [signedmesage, setSignedmesage] = useState('');
let [validcid, setValidcid] = useState('');
let [regok, setRegok] = useState('');
let [role, setRole] = useState('');

useEffect(() => {
  async function fetchData() {

    try {
  
      if (!window.ethereum)
      throw new Error("No crypto wallet found. Please install it.");

    await window.ethereum.send("eth_requestAccounts");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
      const contract = new ethers.Contract(scaAddress, SCA.abi, signer)
      const contractRole = await contract.getRole(address);
      console.log('contractrole',contractRole)
      
       if(contractRole==='0'){
        setRole("Supplier");
      } else if (contractRole=== '1') {
        setRole("Carrier");
      } else {
        setRole("Customer");
      } 

    } catch (error) {
      console.log("error");
      console.error(error);
    } 
  }

  fetchData();

}, []); 


useEffect(() => {
  console.log('role',role)
}, [role])

//Carrier sign message
const signMessage = async ({ setError, message }) => {
  try {
    if (!window.ethereum)
      throw new Error("No crypto wallet found. Please install it.");

    await window.ethereum.send("eth_requestAccounts");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const signature = await signer.signMessage(message);
    setSignedmesage(signature)
    console.log('SIGNATURE:', signedmesage)
    const address = await signer.getAddress();
    console.log('ADDRESS:', address)
    signedmesage = signature;

    return {
      message,
      signature,
      address
    };
  } catch (err) {
    setError(err.message);
  }
};

const handleSign = async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  setError();
  const sig = await signMessage({
    setError,
    message: data.get("message")
  });
  if (sig) {
    console.log('sig',sig)
    addValues(sig);
  }
};

async function addValues(sig) {
  
  console.log('entra a addvalues')
  if (typeof window.ethereum !== 'undefined') {
    await requestAccount()
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()
    const contract = new ethers.Contract(scaAddress, SCA.abi, signer)
    console.log(sig.signature,sig.message, sig.address)
    const transaction = await contract.supply(sig.signature,sig.message)
    await transaction.wait()
  }
}

  // request access to the user's MetaMask account
  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }
  
  //Carrier's registration
  async function registerCarrierCust() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(scaAddress, SCA.abi, signer)
      
      try {
        const transaction = await contract.register(carrier)
        await transaction.wait()
        setRegok('Regisration OK')
        console.log('Registration OK')
      } catch (err) {
        setRegok('Regisration failed')
        console.log("Error: ", err)
      }
    }    
  }

   // IPFS
  const [images, setImages] = useState([])
  const ipfs = ipfsHttpClient({
    url: "https://ipfs.infura.io:5001/api/v0",
    headers: {
      authorization
    }
  })
  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const form = event.target;
    const files = (form[0]).files;

    if (!files || files.length === 0) {
      return alert("No files selected");
    }

    const file = files[0];
    // upload files
    const result =  await ipfs.add(file);
    

    setImages([
     ...images,
      {
        cid: result.cid,
        path: result.path,
      },
    ]);

  
    //add cid to smart contract
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(scaAddress, SCA.abi, signer)
      try {
       
          const transaction = await contract.addcid(result.path)
          await transaction.wait()
          setCid('File upload successfuly')

      } catch (err) {
        console.log("Error: ", err)
      }
    }    

    form.reset();
  };



const handleVerification = async (e) => {
  e.preventDefault();

  const data = new FormData(e.target);
  console.log(data)
  console.log(e.target)
  setError();
  const sig = await signMessage({
    setError,
    message: data.get("message")
  });
  console.log('INPUT',data.get("message"),)
  if (sig) {
    setSignatures(sig);
  }

  if (typeof window.ethereum !== 'undefined') {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const contract = new ethers.Contract(scaAddress, SCA.abi, provider)
    try {
      const data = await contract.show(sig.message,sig.signature)
      console.log('data: ', data)
      if(data==true)  {
        setValidcid('CID OK')
      }
      else{
      setValidcid('CID Incorrect')  
     }
    } catch (err) {
      console.log("Error: ", err)
    }
  }    

};


  return (
    <div className="App">

{ipfs && (
        <>

<h3 class="text-3xl font-bold dark:text-white">
  IPFS Supply Chain Assurance
  </h3>
  <div class="flex items-start mb-6"> </div>

  
  {role === "Supplier" && <h1 className="text-xl font-semibold text-gray-700 text-center">
         1. Carrier registration
        </h1>}
        {role === "Supplier" && <div class="flex items-start mb-6"> </div> }
       <div class="grid mb-2 md:grid-cols-3">
       <div> </div>
        <div> </div>  
        {role === "Supplier" &&<div>
            <label for="last_name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Add carrier</label>

            <input class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-4/5 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" onChange={e => setCarrier(e.target.value)} placeholder="Add Carrier" required />

            <div class="flex items-start mb-6">
       
       </div>
            <p>{regok}</p>
            
        </div> }

        <div class="flex items-start mb-6"></div>
  
    </div> 
    {role === "Supplier" && <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={registerCarrierCust}> Register</button> }
      <br></br>
    
      <div class="flex items-start mb-6"></div>
   
    {role === "Supplier" && <h1 className="text-xl font-semibold text-gray-700 text-center">
            2. Upload the photo of the goods to be transported
          </h1>  }

          {role === "Supplier" &&<div class="flex items-start mb-6"> </div> }
          {role === "Supplier" && <form onSubmit={onSubmitHandler}>
          <div class="flex justify-center">
  <div class="mb-3 w-96">
    
    <input class="form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none" type="file" id="file"
    />
  </div>
</div>
            
            
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" type="submit">Upload file</button>
          </form> }
        </>
      )}

      
{role === "Supplier" &&<div class="flex flex-wrap justify-center">

      {images.map((image, index) => (
          <img
            alt={`Uploaded #${index + 1}`}
            src={"https://skywalker.infura-ipfs.io/ipfs/" + image.path}
            class="p-1 bg-white border rounded max-w-sm"
            style={{ maxWidth: "400px", margin: "15px" }}
            key={image.cid.toString() + index}
          />

          
        ))}

     </div>  }

     
     {images.map((image, index) => (

       <h3>Path:{image.path}</h3> 
  
))} 


<h3>{cid}</h3>
      
       {role === "Carrier" &&<h1 className="text-xl font-semibold text-gray-700 text-center">
        1. The carrier signs the photo
        </h1>}
      
        {role === "Carrier" &&<form className="m-4" onSubmit={handleSign}>
      
           
            <textarea
                required
                type="text"
                name="message"
                className="textarea w-4/6 h-24 textarea-bordered focus:ring focus:outline-none"
                placeholder="Message"
              />
  
  <div class="flex items-start mb-6"> </div>
        
          <button
            type="submit"
            class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
          >
            Sign message
          </button>
          {error} 
          
      
    </form> }
    
<div class="grid grid-cols-3 gap-4"/>
    <div class="flex items-start mb-6"></div>
    
      <br></br>
      
      <br></br>
    
        <div class="flex items-start mb-6"> </div>
        
        
            <div className="hashing-form">
               
            {role === "Supplier" && <h1 className="text-xl font-semibold text-gray-700 text-center">
         3. Download photo from IPFS
        </h1>}

        {role === "Carrier" && <h1 className="text-xl font-semibold text-gray-700 text-center">
         2. Download photo from IPFS
        </h1>}

        {role === "Customer" && <h1 className="text-xl font-semibold text-gray-700 text-center">
         Download photo from IPFS
        </h1>}
      
            <div>
<div class="flex items-start mb-6"></div>
    </div>
    <div class="grid mb-2 md:grid-cols-3">
       <div> </div>
        <div>
            <label for="first_name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Download photo</label>
            <input class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-4/5 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" onChange={e => setBiddoc(e.target.value)} placeholder="Input CID" required/>
        </div> 
        <div> </div>
        <div> </div>
        {biddoc && <div class="flex flex-wrap justify-center">  
                <img

                    alt= "Bidding document"
                    src={"https://skywalker.infura-ipfs.io/ipfs/" + biddoc}
                    style={{ maxWidth: "400px", margin: "15px" }}
 
                    onError={(e) => {
                    e.target.src = "https://skywalker.infura-ipfs.io/ipfs/QmYEGHkGxNut1zGGFiW6ERNgCcV5cwmXcpZgtT2NXUtGDP" //replacement image imported above
                    e.target.style = 'padding: 8px; margin: 16px' // inline styles in html format
                                    }}
/>

             </div>  }
    </div>   


    {role === "Carrier" &&<h1 className="text-xl font-semibold text-gray-700 text-center">
  3.Verification of the CID's authenticity
  </h1>}
  {role === "Carrier" &&<form className="m-4" onSubmit={handleVerification}>
      <div className="credit-card w-full shadow-lg mx-auto rounded-xl bg-white">
        <main className="mt-4 p-4">
        
          <div className="">
            <div className="my-3">
              <textarea
                required
                type="text"
                name="message"
                className="textarea w-4/6 h-24 textarea-bordered focus:ring focus:outline-none"
                placeholder="Message"
              />
            </div>
          </div>
        </main>
        <footer className="p-4">
          <button
            type="submit"
            class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
          >
            Verify
          </button>
          {error} 
        </footer>
        
        <p>{validcid}</p>

      </div>
  
    </form>   

}
          
                    </div>
    </div>

  );
}

export default App;