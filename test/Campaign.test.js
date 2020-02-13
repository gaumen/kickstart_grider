require('events').EventEmitter.defaultMaxListeners = 0;
const assert = require('assert')
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../ethereum/build/CampaignFactory.json');
const compiledCampaign = require('../ethereum/build/Campaign.json');

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () => {
	accounts = await web3.eth.getAccounts();
	factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
	.deploy({data: compiledFactory.bytecode})
	.send({from: accounts[0], gas: '1000000'});

	await factory.methods.createCampaign('100').send({
		from: accounts[0],
		gas: '1000000'
	});

	//GET ADDRESS OF 1ST CAMPAIGN (INDEX 0)
	[campaignAddress] = await factory.methods.getDeployedCampaigns().call();
	//GET A JS REF TO THE ALREADY DEPLOYED CONTRACT
	campaign = await new web3.eth.Contract(
		JSON.parse(compiledCampaign.interface),
		campaignAddress
	);
});

describe('Campaigns', () => {
	it('deploys a factory and a campaign', () => {
		assert.ok(factory.options.address);
		assert.ok(campaign.options.address);
	});

	it('marks caller as manager', async () => {
		const manager = await campaign.methods.manager().call();
		assert.equal(accounts[0],manager);
	});
	it('allows people to contribute money & marks them as approvers', async () => {
		const contributor = await campaign.methods.contribute().send({
			value: '200',
			from: accounts[1]
		});
		const isContributor = await campaign.methods.approvers(accounts[1]).call();
		assert(isContributor);
	});

	it('Requires a minimum contribution', async () => {
		try{
			const contributor = await campaign.methods.contribute().send({
				value: '5',
				from: accounts[2]
			});
			address(false);
		}
		catch(err){
			assert(err);
		}
		
	});

	it('Allows a manager to create request', async () =>{
		await campaign.methods
		.createRequest("Buy batteries", '100', accounts[2])
		.send({
			from: accounts[0],
			gas: '1000000'
		});
		const request = await campaign.methods.requests(0).call();
		assert.equal('Buy batteries', request.description);
	});

	it('processes requests', async () =>{
		await campaign.methods.contribute().send({
			from: accounts[0],
			value: web3.utils.toWei('10', 'ether')
		});
		await campaign.methods
		.createRequest('A', web3.utils.toWei('5','ether'),accounts[1])
		.send({from: accounts[0], gas: '1000000'});

		await campaign.methods.approveRequest(0).send({from: accounts[0], gas: '1000000'});
		await campaign.methods.finalizeRequest(0).send({
			from: accounts[0],
			gas: '1000000'
		});

		let balance = await web3.eth.getBalance(accounts[1]);
		balance = web3.utils.fromWei(balance, 'ether');
		balance = parseFloat(balance);
		console.log(balance);
		assert(balance > 104);
	});

});