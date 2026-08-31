export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  createdByEmail: string;
}

export interface Database {
  users: User[];
  contacts: Contact[];
}

export type ContactInput = Pick<
  Contact,
  "name" | "email" | "phone" | "address" | "lat" | "lng"
>;
