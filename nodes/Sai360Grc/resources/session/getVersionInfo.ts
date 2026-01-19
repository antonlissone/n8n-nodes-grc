import type { INodeProperties, IExecuteFunctions, INodeExecutionData  } from 'n8n-workflow';

import { SAI360ApiRequest } from '../../../../transport'
import * as cheerio from 'cheerio';

export const sessionGetVersionInfoDescription: INodeProperties[] = [
	
];

export async function execute(this: IExecuteFunctions, index: number) {
	const endpoint = '/versioninfo'

	const response = await SAI360ApiRequest.call(this, 'GET', endpoint);
	const $ = cheerio.load(response);
	const text = $('body').text().trim();

	const output: INodeExecutionData[][] = [
		[
			{
				json: { text }, // wrap string inside an object
			},
		],
	];

	return output;
}

