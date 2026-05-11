export interface ZohoTokenBundle {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when access_token is no longer valid */
  expiresAt: number;
  /**
   * Full normalized scope grant as a single string (comma-separated, no truncation).
   * Mirrors {@link grantedScopes}; kept for backward compatibility and logs.
   */
  grantedScope: string;
  /** Individual scopes from the Zoho token response (deduped, trimmed). */
  grantedScopes: string[];
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
