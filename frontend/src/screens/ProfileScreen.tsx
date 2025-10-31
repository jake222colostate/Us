import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';

export default function ProfileScreen() {
  return (
    <ScreenContainer
      title="Your profile"
      subtitle="Preview what others see and keep your story up to date."
    >
      <InfoCard title="Profile completeness" meta="85%">
        Add a recent photo and refresh your prompts to reach 100% completion.
      </InfoCard>
      <InfoCard title="Safety checklist">
        Enable photo verification to give matches extra confidence when connecting.
      </InfoCard>
    </ScreenContainer>
  );
}
