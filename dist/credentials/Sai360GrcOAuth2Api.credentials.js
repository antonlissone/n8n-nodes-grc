"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sai360GrcOAuth2Api = void 0;
class Sai360GrcOAuth2Api {
    constructor() {
        this.name = 'sai360GrcOAuth2Api';
        this.extends = ['oAuth2Api'];
        this.icon = { light: 'file:sai360logo.svg', dark: 'file:sai360logo.dark.svg' };
        this.displayName = 'SAI360 GRC OAuth2 API';
        this.documentationUrl = 'https://github.com/org/@sai360/-grc?tab=readme-ov-file#credentials';
        this.properties = [
            {
                displayName: 'Grant Type',
                name: 'grantType',
                type: 'hidden',
                default: 'authorizationCode',
            },
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'https://customer.sai360.net/bwise',
                required: true,
            },
            {
                displayName: 'Authorization URL',
                name: 'authUrl',
                type: 'string',
                default: 'https://customer.sai360.net/bwise/api/oauth2/authorize',
            },
            {
                displayName: 'Access Token URL',
                name: 'accessTokenUrl',
                type: 'string',
                default: 'https://customer.sai360.net/bwise/api/oauth2/token',
            },
            {
                displayName: 'Client ID',
                name: 'clientId',
                type: 'string',
                default: '',
                required: true,
            },
            {
                displayName: 'Client Secret',
                name: 'clientSecret',
                type: 'string',
                default: '',
                typeOptions: { password: true },
                required: true,
            },
            {
                displayName: 'Scope',
                name: 'scope',
                type: 'string',
                default: 'offline_access',
            },
        ];
    }
}
exports.Sai360GrcOAuth2Api = Sai360GrcOAuth2Api;
//# sourceMappingURL=Sai360GrcOAuth2Api.credentials.js.map