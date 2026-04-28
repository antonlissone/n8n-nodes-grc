import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { SAI360ApiRequestWithDetails } from '../../../../transport/';

export const sessionGetLogDescription: INodeProperties[] = [];

export async function execute(this: IExecuteFunctions, index: number) {
	const endpoint = '/api/log';

	// HTTP errors (4xx/5xx) are converted to NodeApiError inside the transport layer.
	const httpDetails = await SAI360ApiRequestWithDetails.call(
		this,
		'GET',
		endpoint,
		{},
		{},
		{
			headers: { Accept: 'text/plain' },
		},
	);
	const responseBody = httpDetails.response.body;

	const output: INodeExecutionData[] = [
		{
			json: { log: responseBody as string },
			pairedItem: { item: index },
		},
	];

	return output;
}
