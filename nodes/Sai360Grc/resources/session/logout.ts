import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { SAI360ApiRequestWithDetails } from '../../../../transport/';

export const sessionLogoutDescription: INodeProperties[] = [];

export async function execute(this: IExecuteFunctions, index: number) {
	const endpoint = '/api/logout';

	// HTTP errors (4xx/5xx) are converted to NodeApiError inside the transport layer.
	await SAI360ApiRequestWithDetails.call(this, 'POST', endpoint, {}, {});

	const output: INodeExecutionData[] = [
		{
			json: { success: true },
			pairedItem: { item: index },
		},
	];

	return output;
}
