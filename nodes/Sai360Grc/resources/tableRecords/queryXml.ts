import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { SAI360ApiRequestWithDetails } from '../../../../transport';

const showOnlyForTableRecordsQueryXml = {
	operation: ['queryXml'],
	resource: ['tableRecords'],
};

export const tableRecordsQueryXmlDescription: INodeProperties[] = [
	{
		displayName: 'Table Name or ID',
		name: 'tableName',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTables',
		},
		displayOptions: {
			show: {
				...showOnlyForTableRecordsQueryXml,
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

	// --- Query table records (XML endpoint) ---
	const endpoint = `/api/instances/?class=${encodeURIComponent(tableName)}`;

	const httpDetails = await SAI360ApiRequestWithDetails.call(this, 'GET', endpoint, {}, {}, { json: false });

	// --- Check for HTTP errors ---
	const isError = httpDetails.response.isError || false;
	const statusCode = httpDetails.response.statusCode || 0;
	const responseBody = httpDetails.response.body;

	// --- Handle errors ---
	if (isError) {
		const errorMessage = typeof responseBody === 'object' && responseBody !== null
			? JSON.stringify(responseBody)
			: String(responseBody);
		throw new Error(`Request failed with status ${statusCode}: ${errorMessage}`);
	}

	const output: INodeExecutionData[] = [
		{
			json: {},
			binary: undefined,
			pairedItem: { item: index },
		},
	];
	output[0].json = { data: responseBody as IDataObject | string };

	return output;
}
