import type { INodeProperties } from 'n8n-workflow';
import * as queryJson from './queryJson';
import * as queryXml from './queryXml';
import * as saveJson from './saveJson';
import * as saveXml from './saveXml';

const showOnlyForTableRecords = {
	resource: ['tableRecords'],
};

export { queryJson, queryXml, saveJson, saveXml };

export const tableRecordsDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForTableRecords,
		},
		options: [
			{
				name: 'Get Records (JSON)',
				value: 'queryJson',
				action: 'Get table records as JSON',
				description: 'Retrieve table records in JSON format',
			},
			{
				name: 'Get Records (XML)',
				value: 'queryXml',
				action: 'Get table records as XML',
				description: 'Retrieve table records in XML format',
			},
			{
				name: 'Save Table Records From JSON',
				value: 'saveJson',
				action: 'Save table records from JSON',
				description: 'Create or update table records using JSON format',
			},
			{
				name: 'Save Table Records From XML',
				value: 'saveXml',
				action: 'Save table records from XML',
				description: 'Create or update table records using XML format',
			},
		],
		default: 'queryJson',
	},
	...queryJson.tableRecordsQueryJsonDescription,
	...queryXml.tableRecordsQueryXmlDescription,
	...saveJson.tableRecordsSaveJsonDescription,
	...saveXml.tableRecordsSaveXmlDescription,
];
