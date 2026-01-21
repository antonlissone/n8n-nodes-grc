import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { SAI360ApiRequestWithDetails } from '../../../../transport/';

export const sessionGetLogDescription: INodeProperties[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function execute(this: IExecuteFunctions, index: number) {
	const endpoint = '/api/log';

	const httpDetails = await SAI360ApiRequestWithDetails.call(this, 'GET', endpoint, {}, {}, {
		headers: { Accept: 'text/plain' },
	});

	// --- Check for HTTP errors ---
	const isError = httpDetails.response.isError || false;
	const statusCode = httpDetails.response.statusCode || 0;
	const responseBody = httpDetails.response.body;

	// --- Handle errors ---
	if (isError) {
		const errorMessage = typeof responseBody === 'object' && responseBody !== null
			? JSON.stringify(responseBody)
			: String(responseBody);
		throw new Error(`Request failed with status ${statusCode}: ${errorMessage}`);
	}

	const output: INodeExecutionData[][] = [
		[
			{
				json: { log: responseBody as string },
			},
		],
	];

	return output;
}
