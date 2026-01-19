import { NodeConnectionTypes, type INodeType, type INodeTypeDescription, type IExecuteFunctions } from 'n8n-workflow';
import { datastoreDescription } from './resources/datastore';
import { sessionDescription } from './resources/session';
import { workflowDescription } from './resources/workflow';
import { router } from './router';

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
			...workflowDescription,
			...datastoreDescription,
			...sessionDescription,
		],
	};

	async execute(this: IExecuteFunctions) {
		return await router.call(this);
	}
}
