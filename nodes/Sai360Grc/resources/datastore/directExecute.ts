import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { SAI360ApiRequestWithDetails } from '../../../../transport'

const showOnlyForDatastoreDirectExecute = {
	operation: ['directExecute'],
	resource: ['datastore'],
};

export const datastoreDirectExecuteDescription: INodeProperties[] = [
	{
		displayName: 'Datastore Name or ID',
		name: 'datastoreId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getDatastores',
		},
		displayOptions: {
			show: {
				...showOnlyForDatastoreDirectExecute,			
			},
		},
		default: '',
		required: true,
		description: 'Select the datastore to execute and retrieve results from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
];

export async function execute(this: IExecuteFunctions, index: number){
	// --- Get the parameter from node UI ---
	const datastoreId = this.getNodeParameter('datastoreId', index) as string;

	// --- Step 1: Query datastore to get griddata ID ---
	const queryEndpoint = `/api/griddata/query/datastore!${encodeURIComponent(datastoreId)}`;

	const queryDetails = await SAI360ApiRequestWithDetails.call(this, 'POST', queryEndpoint);
	
	// Check for query errors
	if (queryDetails.response.isError) {
		const errorBody = queryDetails.response.body;
		const errorMessage = typeof errorBody === 'object' && errorBody !== null
			? JSON.stringify(errorBody)
			: String(errorBody);
		throw new Error(`Query failed with status ${queryDetails.response.statusCode}: ${errorMessage}`);
	}

	const queryResponse = queryDetails.response.body as IDataObject;

	if (!queryResponse || !queryResponse.id) {
		throw new Error(`Failed to get griddata ID for datastore ${datastoreId}`);
	}

	const gridDataId = queryResponse.id as string;

	// --- Step 2: Fetch all items for that griddata ID ---
	const itemsEndpoint = `/api/griddata/items/${gridDataId}?start=0&limit=10000`;

	const itemsDetails = await SAI360ApiRequestWithDetails.call(this, 'GET', itemsEndpoint);
	
	// Check for items fetch errors
	if (itemsDetails.response.isError) {
		const errorBody = itemsDetails.response.body;
		const errorMessage = typeof errorBody === 'object' && errorBody !== null
			? JSON.stringify(errorBody)
			: String(errorBody);
		throw new Error(`Fetch items failed with status ${itemsDetails.response.statusCode}: ${errorMessage}`);
	}

	const itemsResponse = itemsDetails.response.body;

	// --- Step 3: Return items directly ---
	const items = Array.isArray(itemsResponse) ? itemsResponse : [itemsResponse];

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(items as IDataObject[]),
		{ itemData: { item: index } },
	);

	return executionData;
}

