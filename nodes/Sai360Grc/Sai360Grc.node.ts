import {
	NodeConnectionTypes,
	type INodeType,
	type INodeTypeDescription,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type IDataObject,
	type ResourceMapperFields,
	type ResourceMapperField,
} from 'n8n-workflow';
import { datastoreDescription } from './resources/datastore';
import { tableRecordsDescription } from './resources/tableRecords';
import { sessionDescription } from './resources/session';
import { workflowDescription } from './resources/workflow';
import { graphqlDescription } from './resources/graphql';
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

interface ClassAttribute {
	name: string;
	label?: string;
	type?: string;
	required?: boolean;
	description?: string;
	readOnly?: boolean;
	maxLength?: number;
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
						name: 'GraphQL',
						value: 'graphql',
					},
					{
						name: 'Session',
						value: 'session',
					},
					{
						name: 'Table Record',
						value: 'tableRecords',
					},
					{
						name: 'Workflow',
						value: 'workflow',
					},
				],
				default: 'datastore',
			},
		...tableRecordsDescription,
			...workflowDescription,
			...datastoreDescription,
			...sessionDescription,
			...graphqlDescription,
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
			async getTableFieldsForLookup(this: ILoadOptionsFunctions) {
				const tableName = this.getNodeParameter('tableName', 0) as string;

				// Always include uuid as the first option
				const options = [
					{
						name: 'Uuid',
						value: 'uuid',
						description: 'Use the unique identifier (uuid) for lookup',
					},
				];

				if (!tableName) {
					return options;
				}

				try {
					const response = (await SAI360ApiRequest.call(
						this,
						'GET',
						`/api/datamodel/class/${encodeURIComponent(tableName)}`,
					)) as IDataObject;

					// Extract attributes from response
					let attributes: ClassAttribute[] = [];
					if (Array.isArray(response)) {
						attributes = response as ClassAttribute[];
					} else if (response?.attributes) {
						attributes = response.attributes as ClassAttribute[];
					} else if (response?.fields) {
						attributes = response.fields as ClassAttribute[];
					} else if (response?.properties) {
						attributes = response.properties as ClassAttribute[];
					}

					// Add each attribute as an option (excluding uuid since it's already added)
					for (const attr of attributes) {
						if (attr.name !== 'uuid') {
							options.push({
								name: attr.label || attr.name,
								value: attr.name,
								description: attr.description || `Field: ${attr.name}`,
							});
						}
					}
				} catch {
					// If API call fails, just return uuid option
				}

				return options;
			},
		},
		resourceMapping: {
			async getTableAttributes(
				this: ILoadOptionsFunctions,
			): Promise<ResourceMapperFields> {
				const tableName = this.getNodeParameter('tableName', 0) as string;

				if (!tableName) {
					return { fields: [] };
				}

				const response = (await SAI360ApiRequest.call(
					this,
					'GET',
					`/api/datamodel/class/${encodeURIComponent(tableName)}`,
				)) as IDataObject;

				// Extract attributes from response - adjust based on actual API structure
				let attributes: ClassAttribute[] = [];
				if (Array.isArray(response)) {
					attributes = response as ClassAttribute[];
				} else if (response?.attributes) {
					attributes = response.attributes as ClassAttribute[];
				} else if (response?.fields) {
					attributes = response.fields as ClassAttribute[];
				} else if (response?.properties) {
					attributes = response.properties as ClassAttribute[];
				}

				// Map SAI360 types to n8n resource mapper types
				const mapType = (saiType?: string): ResourceMapperField['type'] => {
					if (!saiType) return 'string';
					const lower = saiType.toLowerCase();
					if (lower.includes('int') || lower.includes('number') || lower.includes('decimal') || lower.includes('float') || lower.includes('double')) {
						return 'number';
					}
					if (lower.includes('bool')) {
						return 'boolean';
					}
					if (lower.includes('date') || lower.includes('time')) {
						return 'dateTime';
					}
					return 'string';
				};

				const fields: ResourceMapperField[] = [
					// Static __uuid field for direct UUID specification
					{
						id: '__uuid',
						displayName: '__uuid (Direct UUID)',
						required: false,
						defaultMatch: false,
						canBeUsedToMatch: true,
						display: true,
						type: 'string',
						readOnly: false,
					},
					// Dynamic fields from API
					...attributes.map((attr) => ({
						id: attr.name,
						displayName: attr.label || attr.name,
						required: attr.required || false,
						defaultMatch: attr.name === 'guid' || attr.name === 'id',
						canBeUsedToMatch: true,
						display: true,
						type: mapType(attr.type),
						readOnly: attr.readOnly || false,
					})),
				];

				return { fields };
			},
		},
	};

	async execute(this: IExecuteFunctions) {
		return await router.call(this);
	}
}
