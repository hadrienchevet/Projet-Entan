'use client';

import { useParams } from 'next/navigation';
import { MemberProfilePage } from '@/modules/team/MemberProfilePage';

export default function Page() {
  const params = useParams();
  const userId = String(params.userId ?? '');
  return <MemberProfilePage userId={userId} />;
}
