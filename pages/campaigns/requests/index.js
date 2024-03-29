import React, {Component} from 'react';
import {Button, Table} from 'semantic-ui-react';
import {Link} from '../../../routes';
import Layout from '../../../components/Layout';
import Campaign from '../../../ethereum/campaign';
import RequestRow from '../../../components/RequestRow';
class RequestIndex extends Component {
	static async getInitialProps(props) {
		const {address} = props.query;
		const campaign = Campaign(address);
		const requestCount = await campaign.methods.getRequestsCount().call();
		//THE FOLL IS USED IN RequestRow.js
		const approversCount = await campaign.methods.approversCount().call();

		//Array.fill() creates an array with indices that we need to request from contract
		const requests = await Promise.all(
			Array(parseInt(requestCount)).fill().map((element, index) => {
				return campaign.methods.requests(index).call()
			})
		);
		console.log(requests);
		return {address, requests, requestCount, approversCount};
	}

	renderRows() {
		return this.props.requests.map((request, index) => {
			return <RequestRow 
			key={index}
			id={index}
			request={request}
			address={this.props.address}
			approversCount={this.props.approversCount}
			/>;
		});
	}
	render(){
		const {Header,Row,HeaderCell,Body} = Table;
		return (
			<Layout>
				<h3>Request List </h3>	
				<Link route={`/campaigns/${this.props.address}/requests/new`}>
					<a>
						<Button primary floated="right" style={{marginBottom:10}}>
							Add Request
						</Button>
					</a>
				</Link>		
				<Table>
					<Header>
						<Row>
							<HeaderCell>ID</HeaderCell>
							<HeaderCell>Description</HeaderCell>
							<HeaderCell>Amount</HeaderCell>
							<HeaderCell>Recipient</HeaderCell>
							<HeaderCell>ApprovalsCount</HeaderCell>
							<HeaderCell>Approve</HeaderCell>
							<HeaderCell>Finalize</HeaderCell>
						</Row>
					</Header>
					<Body>	
						{this.renderRows()}
					</Body>			
				</Table>
				<div>Found {this.props.requestCount} requests </div>
			</Layout>
		);
	}
}

export default RequestIndex;