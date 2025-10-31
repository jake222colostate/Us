import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';

export default function ProfileEditScreen() {
  return (
    <ScreenContainer
      title="Edit profile"
      subtitle="Update your details and adjust discovery preferences."
    >
      <InfoCard title="Photos">
        Drag and drop to reorder your gallery. Square images work best across devices.
      </InfoCard>
      <InfoCard title="Prompts">
        Share a short story, your ideal first date, or weekend plans to spark conversations.
      </InfoCard>
    </ScreenContainer>
  );
}
