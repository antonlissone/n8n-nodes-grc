import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { SAI360ApiRequest } from '../../../../transport/';

export const sessionGetLogDescription: INodeProperties[] = [];

export async function execute(this: IExecuteFunctions, index: number) {
	const endpoint = '/api/log';

	const response = await SAI360ApiRequest.call(this, 'GET', endpoint, undefined, {
		Accept: 'text/plain', // or 'text/html'
	});

	const output: INodeExecutionData[][] = [
		[
			{
				json: { response }, // wrap string inside an object
			},
		],
	];

	return output;
}
