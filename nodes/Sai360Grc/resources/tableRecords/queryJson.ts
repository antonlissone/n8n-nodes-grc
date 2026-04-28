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

	// HTTP errors (4xx/5xx) are converted to NodeApiError inside the transport layer.
	const httpDetails = await SAI360ApiRequestWithDetails.call(this, 'GET', endpoint);
	const responseBody = httpDetails.response.body;
	const items = Array.isArray(responseBody)
		? responseBody
		: ((responseBody as IDataObject)?.items || (responseBody as IDataObject)?.instances || [responseBody]);

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(items as IDataObject[]),
		{ itemData: { item: index } },
	);

	return executionData;
}
