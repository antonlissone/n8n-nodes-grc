import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { SAI360ApiRequestWithDetails } from '../../../../transport';

export const sessionGetVersionInfoDescription: INodeProperties[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function execute(this: IExecuteFunctions, index: number) {
	const endpoint = '/versioninfo';

	const httpDetails = await SAI360ApiRequestWithDetails.call(this, 'GET', endpoint);
	const response = httpDetails.response.body;

	// --- Check for HTTP errors ---
	const isError = httpDetails.response.isError || false;
	const statusCode = httpDetails.response.statusCode || 0;

	// Parse HTML response to extract text (simple regex-based extraction)
	const text =
		typeof response === 'string'
			? response.replace(/<[^>]*>/g, '').trim()
			: JSON.stringify(response);

	// --- Handle errors ---
	if (isError) {
		throw new Error(`Request failed with status ${statusCode}: ${text}`);
	}

	const output: INodeExecutionData[] = [
		{
			json: { versionInfo: text },
			pairedItem: { item: index },
		},
	];

	return output;
}
