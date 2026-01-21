import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { SAI360ApiRequestWithDetails } from '../../../../transport';

const showOnlyForTableRecordsSaveXml = {
	operation: ['saveXml'],
	resource: ['tableRecords'],
};

export const tableRecordsSaveXmlDescription: INodeProperties[] = [
	{
		displayName: 'Table Name or ID',
		name: 'tableName',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTables',
		},
		displayOptions: {
			show: {
				...showOnlyForTableRecordsSaveXml,
			},
		},
		default: '',
		required: true,
		description: 'Select the table to save records to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'XML Data',
		name: 'xmlData',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForTableRecordsSaveXml,
			},
		},
		default: '',
		required: true,
		typeOptions: {
			rows: 10,
		},
		description: 'XML data containing the records to save/update',
	},
];

export async function execute(this: IExecuteFunctions, index: number) {
	// --- Get the parameters from node UI ---
	const tableName = this.getNodeParameter('tableName', index) as string;
	const xmlData = this.getNodeParameter('xmlData', index) as string;

	// --- Save table records (XML endpoint) ---
	const endpoint = `/api/instances?class=${encodeURIComponent(tableName)}`;

	const httpDetails = await SAI360ApiRequestWithDetails.call(
		this,
		'POST',
		endpoint,
		{},
		{},
		{
			json: false,
			body: xmlData,
			headers: {
				'Content-Type': 'application/xml',
                'Accept': '*/*'
			},
		},
	);

	// --- Check for HTTP errors ---
	const isError = httpDetails.response.isError || false;
	const statusCode = httpDetails.response.statusCode || 0;
	const responseBody = httpDetails.response.body;

	// --- Helper to parse SAI360 response messages (handles both JSON and XML error responses) ---
	const parseSai360Messages = (body: unknown): string => {
		if (!body) return '';
		
		// If it's an object (JSON response), try to extract message arrays
		if (typeof body === 'object') {
			const saiResponse = body as IDataObject;
			const messages: string[] = [];
			
			// Extract messages from SAI360 JSON response structure
			const messageTypes = ['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'];
			for (const type of messageTypes) {
				const typeMessages = saiResponse[type] as string[] | undefined;
				if (typeMessages && Array.isArray(typeMessages) && typeMessages.length > 0) {
					messages.push(`${type}: ${typeMessages.join('; ')}`);
				}
			}
			
			if (messages.length > 0) {
				return messages.join('\n');
			}
			
			// Fallback to JSON stringify
			return JSON.stringify(body);
		}
		
		// If it's a string (possibly XML), return as-is
		return String(body);
	};

	// --- Handle errors ---
	if (isError) {
		const errorDetail = parseSai360Messages(responseBody);
		throw new Error(`Request failed with status ${statusCode}:\n${errorDetail}`);
	}

	const output: INodeExecutionData[][] = [
		[
			{
				json: { xml: responseBody as string },
			},
		],
	];

	return output;
}
