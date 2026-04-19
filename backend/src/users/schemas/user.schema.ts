import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export type UserDocument = User & Document;

/** Embedded saved shipping addresses (client `id` is stable, not Mongo subdoc _id). */
const UserAddressEmbeddedSchema = {
  id: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: null },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
};

@Schema({ timestamps: true, id: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  phone: string | null;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: [UserAddressEmbeddedSchema], default: [] })
  addresses: Array<{
    id: string;
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }>;
}

export const UserSchema = SchemaFactory.createForClass(User);
