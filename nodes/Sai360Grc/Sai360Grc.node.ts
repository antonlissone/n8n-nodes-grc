import { NodeConnectionTypes, type INodeType, type INodeTypeDescription, type IExecuteFunctions, type ILoadOptionsFunctions, type IDataObject } from 'n8n-workflow';
import { datastoreDescription } from './resources/datastore';
import { tableRecordsDescription } from './resources/tableRecords';
import { sessionDescription } from './resources/session';
import { workflowDescription } from './resources/workflow';
import { router } from './router';
import { SAI360ApiRequest } from '../../transport';

interface DatastoreEntry {
	identifier: string;
	label: string;
	type: string;
	objectId: string;
}

interface DatastoresResponse {
	entries: DatastoreEntry[];
}

interface TableEntry {
	name: string;
	label: string;
	description?: string;
}

export class Sai360Grc implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SAI360 GRC',
		name: 'sai360Grc',
		icon: { light: 'file:sai360logo.svg', dark: 'file:sai360logo.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the SAI360 GRC API',
		defaults: {
			name: 'SAI360 GRC',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{
			name: 'sai360GrcOAuth2Api', required: false, displayOptions: {
				show: {
					authentication: ['basic'], // Only shows if you somehow had an authType selector
				},
			}
		}, {
			name: 'sai360GrcBasicApi', required: false, displayOptions: {
				show: {
					authentication: ['oauth2'], // Only shows if you somehow had an authType selector
				},
			}
		}],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{ name: 'Basic Auth', value: 'basic' },
					{ name: 'OAuth2', value: 'oauth2' },
				],
				default: 'oauth2',
				description: 'The authentication method to use',
				typeOptions: { hidden: true },
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Datastore',
						value: 'datastore',
					},
					{
						name: 'Table Record',
						value: 'tableRecords',
					},
					{
						name: 'Workflow',
						value: 'workflow',
					},
					{
						name: 'Session',
						value: 'session',
					},
				],
				default: 'datastore',
			},
			...tableRecordsDescription,
			...workflowDescription,
			...datastoreDescription,
			...sessionDescription,
		],
	};

	methods = {
		loadOptions: {
			async getDatastores(this: ILoadOptionsFunctions) {
				const response = await SAI360ApiRequest.call(
					this,
					'GET',
					'/api/datastoreservice/datastores',
				) as DatastoresResponse;

				if (!response?.entries) {
					return [];
				}

				return response.entries.map((ds: DatastoreEntry) => ({
					name: `${ds.label} (${ds.identifier})`,
					value: ds.identifier,
					description: `Type: ${ds.type} | ID: ${ds.objectId}`,
				}));
			},
			async getTables(this: ILoadOptionsFunctions) {
				const response = await SAI360ApiRequest.call(
					this,
					'GET',
					'/api/datamodel/classes',
				) as IDataObject;

				// Handle different response structures - could be array directly or wrapped
				let tables: TableEntry[] = [];
				if (Array.isArray(response)) {
					tables = response as TableEntry[];
				} else if (response?.classes) {
					tables = response.classes as TableEntry[];
				} else if (response?.items) {
					tables = response.items as TableEntry[];
				} else if (response?.entries) {
					tables = response.entries as TableEntry[];
				}

				if (!tables.length) {
					return [];
				}

				return tables.map((tbl: TableEntry) => ({
					name: `${tbl.label || tbl.name} (${tbl.name})`,
					value: tbl.name,
					description: tbl.description || '',
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions) {
		return await router.call(this);
	}
}
