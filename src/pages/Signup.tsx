import { Container } from "../components";
import RegisterComponent from "../components/register/RegisterComponent";
import RecaptchaProviderGate from "../components/privacy/RecaptchaProviderGate";

function Signup() {
  return (
    <Container>
      {/* Blocks the form until the anti-bot tracker is allowed, then loads
          reCAPTCHA and only mounts the form once it is actually ready. */}
      <RecaptchaProviderGate>
        <RegisterComponent />
      </RecaptchaProviderGate>
    </Container>
  );
}

export default Signup;
