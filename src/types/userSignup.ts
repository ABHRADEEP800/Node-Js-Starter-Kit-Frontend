export type UserSignup = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  cnfPassword?: string;
  recaptchaToken?: string | undefined;
};
