import { HelpPage } from '@/modules/help/HelpPage';
import { HelpTabs } from '@/modules/help/HelpTabs';

export default function Page() {
  return <HelpTabs learn={<HelpPage />} />;
}
