import { Container } from "../components";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

import RegisterComponent from "../components/register/RegisterComponent";

function Signup() {
  return (
    <Container>
      <GoogleReCaptchaProvider
        reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        scriptProps={{ async: true, defer: true }}
      >
        <RegisterComponent />
      </GoogleReCaptchaProvider>
    </Container>
  );
}

export default Signup;
