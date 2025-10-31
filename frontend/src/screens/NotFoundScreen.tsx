import GoHomeButton from '../components/GoHomeButton';
import InfoCard from '../components/InfoCard';
import ScreenContainer from '../components/ScreenContainer';

export default function NotFoundScreen() {
  return (
    <ScreenContainer
      title="Page not found"
      subtitle="The page you are looking for moved or no longer exists."
    >
      <InfoCard title="Back to home">
        <GoHomeButton />
      </InfoCard>
    </ScreenContainer>
  );
}
