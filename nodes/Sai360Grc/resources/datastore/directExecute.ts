import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { SAI360ApiRequest } from '../../../../transport'

const showOnlyForDatastoreDirectExecute = {
	operation: ['directExecute'],
	resource: ['datastore'],
};

export const datastoreDirectExecuteDescription: INodeProperties[] = [
	{
		displayName: 'Datastore Id',
		name: 'datastoreId',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForDatastoreDirectExecute,			
			},
		},
		default: '',
		required: true,
		placeholder: 'Solutions_COI_Disclosures',
		description: 'Datastore Identifier to execute and retrieve results from',
	},
];

export async function execute(this: IExecuteFunctions, index: number){
	// --- Get the parameter from node UI ---
	const datastoreId = this.getNodeParameter('datastoreId', index) as string;

	// --- Step 1: Query datastore to get griddata ID ---
	const queryEndpoint = `/api/griddata/query/datastore!${encodeURIComponent(datastoreId)}`;

	const queryResponse = await SAI360ApiRequest.call(this, 'POST', queryEndpoint);

	if (!queryResponse || !queryResponse.id) {
		throw new Error(`Failed to get griddata ID for datastore ${datastoreId}`);
	}

	const gridDataId = queryResponse.id as string;

	// --- Step 2: Fetch all items for that griddata ID ---
	const itemsEndpoint = `/api/griddata/items/${gridDataId}?start=0&limit=10000`;

	const itemsResponse = await SAI360ApiRequest.call(this, 'GET', itemsEndpoint);


	// --- Step 3: Return data in n8n execution format ---
	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(itemsResponse as IDataObject[]),
		{ itemData: { item: index } },
	);

	return executionData;
}

