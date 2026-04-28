import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { SAI360ApiRequestWithDetails } from '../../../../transport';

const showOnlyForTableRecordsSaveJson = {
	operation: ['saveJson'],
	resource: ['tableRecords'],
};

export const tableRecordsSaveJsonDescription: INodeProperties[] = [
	{
		displayName: 'Table Name or ID',
		name: 'tableName',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTables',
		},
		displayOptions: {
			show: {
				...showOnlyForTableRecordsSaveJson,
			},
		},
		default: '',
		required: true,
		description: 'Select the table to save records to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Records',
		name: 'records',
		type: 'json',
		displayOptions: {
			show: {
				...showOnlyForTableRecordsSaveJson,
			},
		},
		default: '[]',
		required: true,
		description: 'JSON array of records to save/update',
	},
	{
		displayName: 'Batch Size',
		name: 'batchSize',
		type: 'number',
		displayOptions: {
			show: {
				...showOnlyForTableRecordsSaveJson,
			},
		},
		default: 0,
		description: 'Number of records per batch. Set to 0 for all-or-nothing (no batching).',
		typeOptions: {
			minValue: 0,
		},
	},
];

export async function execute(this: IExecuteFunctions, index: number) {
	// --- Get the parameters from node UI ---
	const tableName = this.getNodeParameter('tableName', index) as string;
	const recordsJson = this.getNodeParameter('records', index) as string;
	const batchSize = this.getNodeParameter('batchSize', index) as number;

	// Parse records
	let records: IDataObject[];
	try {
		records = JSON.parse(recordsJson);
		if (!Array.isArray(records)) {
			records = [records];
		}
	} catch {
		throw new NodeOperationError(this.getNode(), 'Invalid JSON in Records field', {
			itemIndex: index,
		});
	}

	// --- Build endpoint with optional batch size ---
	let endpoint = `/api/modelinstance/${encodeURIComponent(tableName)}/json`;
	if (batchSize > 0) {
		endpoint += `?batchsize=${batchSize}`;
	}

	// HTTP errors (4xx/5xx) are converted to NodeApiError inside the transport layer.
	// SAI360 message arrays (FATAL/ERROR/WARNING) are parsed and surfaced in the
	// error description automatically.
	const httpDetails = await SAI360ApiRequestWithDetails.call(
		this,
		'POST',
		endpoint,
		records as unknown as IDataObject,
	);
	const responseBody = httpDetails.response.body;
	const result = Array.isArray(responseBody) ? responseBody : [responseBody];

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(result as IDataObject[]),
		{ itemData: { item: index } },
	);

	return executionData;
}
