import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';

export default function HelpScreen() {
  return (
    <ScreenContainer
      title="Help center"
      subtitle="Find quick answers or reach out to our support team."
    >
      <InfoCard title="FAQs">Browse the top questions about discovery, messaging, and billing.</InfoCard>
      <InfoCard title="Contact support">
        Send us a note and we will get back within one business day.
      </InfoCard>
    </ScreenContainer>
  );
}
