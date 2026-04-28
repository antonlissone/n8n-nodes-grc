import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { SAI360ApiRequestWithDetails } from '../../../../transport';

export const sessionGetVersionInfoDescription: INodeProperties[] = [];

export async function execute(this: IExecuteFunctions, index: number) {
	const endpoint = '/versioninfo';

	// HTTP errors (4xx/5xx) are converted to NodeApiError inside the transport layer.
	const httpDetails = await SAI360ApiRequestWithDetails.call(this, 'GET', endpoint);
	const response = httpDetails.response.body;

	// Parse HTML response to extract text (simple regex-based extraction)
	const text =
		typeof response === 'string'
			? response.replace(/<[^>]*>/g, '').trim()
			: JSON.stringify(response);

	const output: INodeExecutionData[] = [
		{
			json: { versionInfo: text },
			pairedItem: { item: index },
		},
	];

	return output;
}
