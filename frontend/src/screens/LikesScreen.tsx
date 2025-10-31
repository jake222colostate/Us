import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';

export default function LikesScreen() {
  return (
    <ScreenContainer
      title="Likes"
      subtitle="Keep track of who has shown interest in your profile."
    >
      <InfoCard title="You’re all caught up">We’ll notify you the moment a new like comes in.</InfoCard>
      <InfoCard title="Boost visibility">
        Try refreshing your profile prompts to stay at the top of discovery lists.
      </InfoCard>
    </ScreenContainer>
  );
}
