import { Container, LoginComponent } from "../components";
import RecaptchaProviderGate from "../components/privacy/RecaptchaProviderGate";

function Signin() {
  return (
    <Container>
      <RecaptchaProviderGate>
        <LoginComponent />
      </RecaptchaProviderGate>
    </Container>
  );
}

export default Signin;
