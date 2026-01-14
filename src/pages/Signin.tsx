import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { Container, LoginComponent } from "../components";

function Signin() {
  return (
    <Container>
      <GoogleReCaptchaProvider
        reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        scriptProps={{ async: true, defer: true }}
      >
        <LoginComponent />
      </GoogleReCaptchaProvider>
    </Container>
  );
}

export default Signin;
