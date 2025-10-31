import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';

export default function SafetyScreen() {
  return (
    <ScreenContainer
      title="Safety center"
      subtitle="Your wellbeing is our top priority."
    >
      <InfoCard title="Safety tips">
        Meet in public places, share your plans with a friend, and report anything that feels off.
      </InfoCard>
      <InfoCard title="Emergency support">
        Contact our 24/7 trust and safety team directly from this screen if you ever need help.
      </InfoCard>
    </ScreenContainer>
  );
}
