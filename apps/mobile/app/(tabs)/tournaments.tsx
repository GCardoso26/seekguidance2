import { WebViewScreen } from '../../components/WebViewScreen';
import { WEB_ROUTES } from '../../lib/config';

export default function TournamentsTab() {
  return <WebViewScreen path={WEB_ROUTES.tournaments} />;
}
