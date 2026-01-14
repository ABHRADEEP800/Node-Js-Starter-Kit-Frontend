export type UserSignup = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  cnfPassword?: string;
  recaptchaToken?: string | undefined;
};
