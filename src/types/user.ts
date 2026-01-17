export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  createdAt?: Date;
  updatedAt?: Date;
  role: "user" | "admin";
}
