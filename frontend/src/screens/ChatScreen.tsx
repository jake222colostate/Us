import ScreenContainer from '../components/ScreenContainer';
import InfoCard from '../components/InfoCard';

export default function ChatScreen() {
  return (
    <ScreenContainer
      title="Messages"
      subtitle="Keep the conversation going with matches you care about."
    >
      <InfoCard title="No unread conversations">Send a quick hello to break the ice.</InfoCard>
      <InfoCard title="Voice notes" meta="Coming soon">
        Drop short voice memos when typing is not convenient. Enable push notifications to never miss a reply.
      </InfoCard>
    </ScreenContainer>
  );
}
