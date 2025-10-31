import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';
import { useMatches } from '../hooks/useMatches';

const formatCompatibility = (value: number) => `${value}% compatible`;

export default function MatchesScreen() {
  const { data, loading, error } = useMatches();

  return (
    <ScreenContainer
      title="Matches"
      subtitle="Review people who are excited to connect with you."
    >
      {loading ? <InfoCard title="Loading matches">Syncing your match list...</InfoCard> : null}
      {!loading && error ? (
        <InfoCard title="Offline results" meta="Matches">
          Showing the most recent matches stored on this device until we can reconnect.
        </InfoCard>
      ) : null}
      {!loading
        ? data.map((match) => (
            <InfoCard key={match.id} title={match.name} meta={formatCompatibility(match.compatibility)}>
              Tap to open a conversation or review shared interests.
            </InfoCard>
          ))
        : null}
    </ScreenContainer>
  );
}
