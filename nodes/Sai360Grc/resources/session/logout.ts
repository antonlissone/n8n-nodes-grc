import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { SAI360ApiRequestWithDetails } from '../../../../transport/';

export const sessionLogoutDescription: INodeProperties[] = [];

export async function execute(this: IExecuteFunctions, index: number) {
	const endpoint = '/api/logout';

	const httpDetails = await SAI360ApiRequestWithDetails.call(this, 'POST', endpoint, {}, {});

	// --- Check for HTTP errors ---
	const isError = httpDetails.response.isError || false;
	const statusCode = httpDetails.response.statusCode || 0;
	const responseBody = httpDetails.response.body;

	// --- Handle errors ---
	if (isError) {
		const errorMessage =
			typeof responseBody === 'object' && responseBody !== null
				? JSON.stringify(responseBody)
				: String(responseBody);
		throw new Error(`Request failed with status ${statusCode}: ${errorMessage}`);
	}

	const output: INodeExecutionData[] = [
		{
			json: { success: true },
			pairedItem: { item: index },
		},
	];

	return output;
}
