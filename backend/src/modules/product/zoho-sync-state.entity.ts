import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ZohoSyncStateDocument = HydratedDocument<ZohoSyncState>;

export type ZohoSyncStatus = 'idle' | 'running' | 'success' | 'failed';

@Schema({
  timestamps: true,
  collection: 'zoho_sync_state',
  id: false,
})
export class ZohoSyncState {
  @Prop({ required: true, unique: true, default: 'inventory' })
  key: string;

  @Prop({ type: Date, default: null })
  last_full_sync_at: Date | null;

  @Prop({ type: Date, default: null })
  last_incremental_sync_at: Date | null;

  @Prop({ type: Number, default: 1 })
  last_successful_page: number;

  @Prop({
    type: String,
    enum: ['idle', 'running', 'success', 'failed'],
    default: 'idle',
  })
  sync_status: ZohoSyncStatus;

  @Prop({ type: String, default: null })
  last_error: string | null;
}

export const ZohoSyncStateSchema = SchemaFactory.createForClass(ZohoSyncState);
