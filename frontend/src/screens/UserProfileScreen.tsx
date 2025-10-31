import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';
import { useUserId } from '../navigation/useUserId';

export default function UserProfileScreen() {
  const userId = useUserId();

  return (
    <ScreenContainer
      title={`@${userId || 'user'}`}
      subtitle="Preview another member’s public profile."
    >
      <InfoCard title="Shared interests">
        You both highlighted hiking, coffee shop hopping, and independent films.
      </InfoCard>
      <InfoCard title="Start a chat">
        Break the ice with a thoughtful question and see where the conversation goes.
      </InfoCard>
    </ScreenContainer>
  );
}
