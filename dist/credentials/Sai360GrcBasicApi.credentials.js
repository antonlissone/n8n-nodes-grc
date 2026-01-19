"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sai360GrcBasicApi = void 0;
class Sai360GrcBasicApi {
    constructor() {
        this.name = 'sai360GrcBasicApi';
        this.displayName = 'SAI360 GRC API (Basic Auth)';
        this.documentationUrl = '';
        this.properties = [
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'https://customer.sai360.net/bwise',
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