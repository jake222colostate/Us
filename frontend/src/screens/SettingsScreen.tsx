import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';

export default function SettingsScreen() {
  return (
    <ScreenContainer
      title="Settings"
      subtitle="Control notifications, privacy, and connected accounts."
    >
      <InfoCard title="Notifications">
        Choose which push, email, and SMS alerts you want to receive.
      </InfoCard>
      <InfoCard title="Discovery">
        Adjust distance, age range, and weekly discovery goals.
      </InfoCard>
    </ScreenContainer>
  );
}
