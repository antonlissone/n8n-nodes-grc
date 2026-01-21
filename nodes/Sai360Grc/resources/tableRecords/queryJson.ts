import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { SAI360ApiRequestWithDetails } from '../../../../transport';

const showOnlyForTableRecordsQueryJson = {
	operation: ['queryJson'],
	resource: ['tableRecords'],
};

export const tableRecordsQueryJsonDescription: INodeProperties[] = [
	{
		displayName: 'Table Name or ID',
		name: 'tableName',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTables',
		},
		displayOptions: {
			show: {
				...showOnlyForTableRecordsQueryJson,
			},
		},
		default: '',
		required: true,
		description: 'Select the table to retrieve records from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
];

export async function execute(this: IExecuteFunctions, index: number) {
	// --- Get the parameters from node UI ---
	const tableName = this.getNodeParameter('tableName', index) as string;

	// --- Query table records (JSON endpoint) ---
	const endpoint = `/api/modelinstance/${encodeURIComponent(tableName)}/json`;

	const httpDetails = await SAI360ApiRequestWithDetails.call(this, 'GET', endpoint);

	// --- Check for HTTP errors ---
	const isError = httpDetails.response.isError || false;
	const statusCode = httpDetails.response.statusCode || 0;

	// --- Extract items from response ---
	const responseBody = httpDetails.response.body;
	const items = Array.isArray(responseBody) 
		? responseBody 
		: ((responseBody as IDataObject)?.items || (responseBody as IDataObject)?.instances || [responseBody]);
	
	// --- Handle errors ---
	if (isError) {
		const errorMessage = typeof responseBody === 'object' && responseBody !== null
			? JSON.stringify(responseBody)
			: String(responseBody);
		throw new Error(`Request failed with status ${statusCode}: ${errorMessage}`);
	}

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(items as IDataObject[]),
		{ itemData: { item: index } },
	);

	return executionData;
}
