import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceShell } from '@/components/WorkspaceShell';

/** Espace de travail authentifié : tout vit côté client (comme la V1). */
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <WorkspaceShell>{children}</WorkspaceShell>;
}
