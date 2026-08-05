// Mirrors the backend user output DTO (src/dto/user.dto.js/.ts) — only fields
// the server whitelists are present here.
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: "user" | "admin";
  createdAt?: string;
}
