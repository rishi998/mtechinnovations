export interface ZohoTokenBundle {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when access_token is no longer valid */
  expiresAt: number;
  /** Scopes Zoho associated with this grant (format may be comma or space separated). */
  grantedScope: string;
  /** e.g. www.zohoapis.com — use to build regional Inventory base URL */
  apiDomain?: string;
}

export interface ZohoTokenEndpointSuccess {
  access_token: string;
  refresh_token?: string;
  expires_in: string | number;
  token_type?: string;
  scope?: string;
  api_domain?: string;
}

export interface ZohoTokenEndpointError {
  error?: string;
  error_description?: string;
}
