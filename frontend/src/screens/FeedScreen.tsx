import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';
import { useFeed } from '../hooks/useFeed';

export default function FeedScreen() {
  const { data, loading, error } = useFeed();

  return (
    <ScreenContainer
      title="Your feed"
      subtitle="Stay updated with recommended stories and nearby matches."
    >
      {loading ? <InfoCard title="Loading feed">Fetching recent updates...</InfoCard> : null}
      {!loading && error ? (
        <InfoCard title="Using cached feed" meta="Feed">
          We will refresh automatically once a network connection is restored.
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
