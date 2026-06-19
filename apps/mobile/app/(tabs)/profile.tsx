import { WebViewScreen } from '../../components/WebViewScreen';
import { WEB_ROUTES } from '../../lib/config';

export default function ProfileTab() {
  return <WebViewScreen path={WEB_ROUTES.profile} />;
}
