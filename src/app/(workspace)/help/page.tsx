import { HelpPage } from '@/modules/help/HelpPage';
import { HelpTabs } from '@/modules/help/HelpTabs';
import { StartChecklist } from '@/modules/help/StartChecklist';

export default function Page() {
  return <HelpTabs learn={<HelpPage variant="app" checklist={<StartChecklist />} />} />;
}
