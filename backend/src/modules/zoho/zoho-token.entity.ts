import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ZohoTokenStateDocument = HydratedDocument<ZohoTokenState>;

/**
 * Single-document store for Zoho OAuth token bundle.
 * We keep one row keyed by `default` for this deployment.
 */
@Schema({
  timestamps: true,
  collection: 'zoho_oauth_tokens',
  id: false,
})
export class ZohoTokenState {
  @Prop({ required: true, unique: true, index: true, default: 'default' })
  key: string;

  @Prop({ required: true })
  accessToken: string;

  @Prop({ required: true })
  refreshToken: string;

  @Prop({ required: true })
  expiresAt: number;

  @Prop({ required: true })
  grantedScope: string;

  @Prop({ type: String, default: null })
  apiDomain: string | null;
}

export const ZohoTokenStateSchema = SchemaFactory.createForClass(ZohoTokenState);
