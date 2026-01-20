"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sai360GrcBasicApi = void 0;
class Sai360GrcBasicApi {
    constructor() {
        this.name = 'sai360GrcBasicApi';
        this.displayName = 'SAI360 GRC API (Basic Auth) API';
        this.icon = { light: 'file:sai360logo.svg', dark: 'file:sai360logo.dark.svg' };
        this.documentationUrl = 'https://github.com/antonlissone/n8n-nodes-grc';
        this.properties = [
            {
                displayName: 'Base URL (with context e.g. /bwise if applicable)',
                name: 'baseUrl',
                type: 'string',
                default: 'https://customer.sai360.net',
                required: true,
            },
            {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Password',
                name: 'password',
                type: 'string',
                default: '',
                typeOptions: { password: true },
            },
        ];
        this.test = {
            request: {
                method: 'POST',
                baseURL: '={{ $credentials.baseUrl }}',
                url: '/api/login',
                body: {
                    username: '={{ $credentials.username }}',
                    password: '={{ $credentials.password }}',
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                json: false,
            },
        };
    }
}
exports.Sai360GrcBasicApi = Sai360GrcBasicApi;
//# sourceMappingURL=Sai360GrcBasicApi.credentials.js.map