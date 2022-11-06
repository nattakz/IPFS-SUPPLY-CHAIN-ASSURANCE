// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract SCA {
    address public supplier;

    struct Cert {
        string hashedcid;
        uint256 regcid;
    }

    //Only membership can view system data
    mapping(address => uint256) carriermember;
    mapping(string => Cert) cert;

    modifier onlySupplier() {
        require(msg.sender == supplier);
        _;
    }

    modifier onlyCarrier() {
        require(carriermember[msg.sender] == 1);
        _;
    }

    constructor() {
        supplier = msg.sender;
    }

    function register(address payable Carrier) public onlySupplier {
        carriermember[Carrier] = 1;
    }

    function unregister(address payable Carrier) public onlySupplier {
        carriermember[Carrier] = 0;
    }


    function addcid(string memory Cid) public payable onlySupplier {
        cert[Cid] = Cert({hashedcid: "0", regcid: 1});
    }

    function supply(string memory Hashcid, string memory Cid)
        public
        payable
        onlyCarrier
    {
        require(cert[Cid].regcid == 1, "supplier");

        cert[Cid] = Cert({hashedcid: Hashcid, regcid: 1});
    }

    // verify cid/signature
    function show(string memory Cid, string memory cidverify)
        public
        view
        returns (bool)
    {
        return (keccak256(abi.encodePacked((cidverify))) ==
            keccak256(abi.encodePacked((cert[Cid].hashedcid))));
    }


    function showhash(string memory Cid) public view returns (string memory) {
        return (cert[Cid].hashedcid);
    }

    function getRole(address user) public view returns (string memory) {
        if (user == supplier) {
            return "0";
        } else if (carriermember[user] == 1) {
            return "1";
        } else {
            return "2";
        }
    }

    function showcarrier() public view returns (bool) {
        return (carriermember[msg.sender]) == 1;
    }
}
