import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

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
		description:
			'Select the table to save records to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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

	// HTTP errors (4xx/5xx) are converted to NodeApiError inside the transport layer.
	// For XML POSTs the transport additionally fetches /api/log and appends it to
	// the error description (the XML response body is rarely informative).
	const httpDetails = await SAI360ApiRequestWithDetails.call(
		this,
		'POST',
		endpoint,
		xmlData,
		{},
		{
			json: false,
			headers: {
				Accept: '*/*',
				'Content-Type': 'application/xml',
			},
		},
	);
	const responseBody = httpDetails.response.body;

	const output: INodeExecutionData[] = [
		{
			json: { xml: responseBody as string },
			pairedItem: { item: index },
		},
	];

	return output;
}
