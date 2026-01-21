import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

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
		throw new Error('Invalid JSON in Records field');
	}

	// --- Build endpoint with optional batch size ---
	let endpoint = `/api/modelinstance/${encodeURIComponent(tableName)}/json`;
	if (batchSize > 0) {
		endpoint += `?batchsize=${batchSize}`;
	}

	const httpDetails = await SAI360ApiRequestWithDetails.call(this, 'POST', endpoint, records as unknown as IDataObject);

	// --- Check for HTTP errors ---
	const isError = httpDetails.response.isError || false;
	const statusCode = httpDetails.response.statusCode || 0;

	// --- Extract result from response ---
	const responseBody = httpDetails.response.body;
	const result = Array.isArray(responseBody) ? responseBody : [responseBody];

	// --- Helper to parse SAI360 response messages ---
	const parseSai360Messages = (body: unknown): string => {
		if (!body || typeof body !== 'object') return '';
		
		const saiResponse = body as IDataObject;
		const messages: string[] = [];
		
		// Extract messages from SAI360 response structure
		const messageTypes = ['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'];
		for (const type of messageTypes) {
			const typeMessages = saiResponse[type] as string[] | undefined;
			if (typeMessages && Array.isArray(typeMessages) && typeMessages.length > 0) {
				messages.push(`${type}: ${typeMessages.join('; ')}`);
			}
		}
		
		return messages.join('\n');
	};

	// --- Handle errors ---
	if (isError) {
		const saiMessages = parseSai360Messages(responseBody);
		const errorDetail = saiMessages || (typeof responseBody === 'object' && responseBody !== null
			? JSON.stringify(responseBody)
			: String(responseBody));
		throw new Error(`Request failed with status ${statusCode}:\n${errorDetail}`);
	}

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(result as IDataObject[]),
		{ itemData: { item: index } },
	);

	return executionData;
}
