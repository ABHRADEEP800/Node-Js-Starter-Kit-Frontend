export type UserLogin = {
  username: string;
  password: string;
  rememberMe?: boolean | undefined;
  recaptchaToken?: string | undefined;
};
