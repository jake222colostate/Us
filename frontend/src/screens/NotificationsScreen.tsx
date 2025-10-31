import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';

export default function NotificationsScreen() {
  return (
    <ScreenContainer
      title="Notifications"
      subtitle="Review recent alerts and adjust your preferences."
    >
      <InfoCard title="No new notifications">You’re all caught up for now.</InfoCard>
      <InfoCard title="Tip">
        Enable push notifications on mobile to get real-time updates.
      </InfoCard>
    </ScreenContainer>
  );
}
