import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';
import { useFeed } from '../hooks/useFeed';

export default function HomeScreen() {
  const { data, loading, error } = useFeed();

  return (
    <ScreenContainer
      title="Welcome back"
      subtitle="Catch up on the latest activity from your connections."
    >
      {loading ? <InfoCard title="Loading feed">Fetching personalized updates...</InfoCard> : null}
      {!loading && error ? (
        <InfoCard title="Offline mode" meta="Feed">
          We could not reach the live feed yet. Showing the latest cached insights instead.
        </InfoCard>
      ) : null}
      {!loading
        ? data.map((item) => (
            <InfoCard key={item.id} title={item.title}>
              {item.summary}
            </InfoCard>
          ))
        : null}
    </ScreenContainer>
  );
}
