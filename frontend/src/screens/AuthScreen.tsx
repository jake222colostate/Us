import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';

export default function AuthScreen() {
  return (
    <ScreenContainer
      title="Sign in"
      subtitle="Access your account securely."
    >
      <InfoCard title="One-tap login">
        Use your mobile number or magic link to sign in instantly.
      </InfoCard>
      <InfoCard title="New here?">
        Create an account to start exploring compatible matches nearby.
      </InfoCard>
    </ScreenContainer>
  );
}
