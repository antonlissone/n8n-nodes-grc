import type { INodeProperties, IExecuteFunctions, INodeExecutionData  } from 'n8n-workflow';

import { SAI360ApiRequest } from '../../../../transport'

export const sessionGetVersionInfoDescription: INodeProperties[] = [
	
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function execute(this: IExecuteFunctions, _index: number) {
	const endpoint = '/versioninfo'

	const response = await SAI360ApiRequest.call(this, 'GET', endpoint);
	// Parse HTML response to extract text (simple regex-based extraction)
	const text = typeof response === 'string' 
		? response.replace(/<[^>]*>/g, '').trim() 
		: JSON.stringify(response);

	const output: INodeExecutionData[][] = [
		[
			{
				json: { text }, // wrap string inside an object
			},
		],
	];

	return output;
}

