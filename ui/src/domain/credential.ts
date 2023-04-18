export interface Credential {
  createdAt: Date;
  credentialSubject: {
    type: string;
  };
  expired: boolean;
  expiresAt?: Date;
  id: string;
  revNonce: number;
  revoked: boolean;
}

export type CredentialsTabIDs = "issued" | "links";

export type LinkStatus = "active" | "inactive" | "exceeded";

export interface Link {
  active: boolean;
  expiration?: Date;
  id: string;
  issuedClaims: number;
  maxIssuance?: number | null;
  schemaType: string;
  schemaUrl: string;
  status: LinkStatus;
}
