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

			},
			{
				name: 'Retrieve Log',
				value: 'getLog',
				action: 'Retrieve log',

			},
			{
				name: 'Get Version Info',
				value: 'getVersionInfo',
				action: 'Get version info',

			},
		],
		default: 'getLog',
	},
	...getLog.sessionGetLogDescription,
	...logout.sessionLogoutDescription,
	...getVersionInfo.sessionGetVersionInfoDescription,
];
