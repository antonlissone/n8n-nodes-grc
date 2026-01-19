import type { INodeProperties } from 'n8n-workflow';
import * as getLog from './getLog';
import * as logout from './logout';
import * as getVersionInfo from './getVersionInfo';

export { getLog, logout, getVersionInfo };

const showOnlyForSession = {
	resource: ['session'],
};

export const sessionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForSession,
		},
		options: [
			{
				name: 'Logout',
				value: 'logout',
				action: 'Logout',
				description: 'Logout',
			},
			{
				name: 'Retrieve Log',
				value: 'getLog',
				action: 'Retrieve Log',
				description: 'Retrieve Log',
			},
			{
				name: 'Get Version Info',
				value: 'getVersionInfo',
				action: 'Get Version Info',
				description: 'Get Version Info',
			},
		],
		default: 'getLog',
	},
	...getLog.sessionGetLogDescription,
	...logout.sessionLogoutDescription,
	...getVersionInfo.sessionGetVersionInfoDescription,
];
