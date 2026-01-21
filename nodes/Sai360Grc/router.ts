import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import * as tableRecords from './resources/tableRecords';
import * as datastore from './resources/datastore';
import * as workflow from './resources/workflow';
import * as session from './resources/session';

import type { SAI360 } from './node.type';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResourceModule = Record<string, { execute: (this: IExecuteFunctions, index: number) => Promise<any> }>;

export async function router(this: IExecuteFunctions) {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	const resource = this.getNodeParameter<SAI360>('resource', 0) as string;
	const operation = this.getNodeParameter('operation', 0) as string;

	const sai360 = { resource, operation } as SAI360;

	for (let i = 0; i < items.length; i++) {
		try {
			let responseData: INodeExecutionData[][];

			switch (sai360.resource) {
				case 'tableRecords':
					responseData = await (tableRecords as unknown as ResourceModule)[sai360.operation].execute.call(this, i);
					break;
				case 'datastore':
					responseData = await (datastore as unknown as ResourceModule)[sai360.operation].execute.call(this, i);
					break;
				case 'session':
					responseData = await (session as unknown as ResourceModule)[sai360.operation].execute.call(this, i);
					break;
				case 'workflow':
					responseData = await (workflow as unknown as ResourceModule)[sai360.operation].execute.call(this, i);
					break;
				default:
					throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not known`);
			}

			// flatten the inner array
			returnData.push(...responseData.flat());

		} catch (error) {
			if (this.continueOnFail()) {
				const message = error instanceof Error ? error.message : String(error);
				const executionErrorData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray({ error: message }),
					{ itemData: { item: i } },
				);
				returnData.push(...executionErrorData);
				continue;
			}

			//NodeApiError missing itemIndex
			if (error instanceof NodeApiError && error?.context?.itemIndex === undefined) {
				if (error.context === undefined) {
					error.context = {};
				}
				error.context.itemIndex = i;
			}
			throw error;
		}
	}

	// return 2D array: one output with all items
	return [returnData];
}