import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';

export default function OnboardingScreen() {
  return (
    <ScreenContainer
      title="Onboarding"
      subtitle="We use these steps to personalize your matches."
    >
      <InfoCard title="Tell us about you">Share your interests, values, and what you are looking for.</InfoCard>
      <InfoCard title="Complete verification">
        Confirm your phone number and upload a quick selfie for safety.
      </InfoCard>
    </ScreenContainer>
  );
}
