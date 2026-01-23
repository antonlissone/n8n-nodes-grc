import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { SAI360ApiRequestWithDetails, SAI360GetLog } from '../../../../transport';

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
		xmlData,
		{},
		{
			json: false,
			headers: {
				'Accept': '*/*',
				'Content-Type': 'application/xml',
			},
		},
	);


	// --- Check for HTTP errors ---
	const isError = httpDetails.response.isError || false;
	const statusCode = httpDetails.response.statusCode || 0;
	const responseBody = httpDetails.response.body;

	// --- Handle errors ---
	if (isError) {
		// Fetch detailed error log from SAI360
		const errorLog = await SAI360GetLog.call(this);
		const errorDetail = typeof responseBody === 'string' ? responseBody : String(responseBody);
		throw new Error(`Request failed with status ${statusCode}:\n${errorDetail}\n\nAPI Log:\n${errorLog}`);
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
