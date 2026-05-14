'use client';

import dynamic from 'next/dynamic';

const StoryForm = dynamic(() => import('@/app/components/StoryForm'), {
  loading: () => (
    <div className="animate-pulse space-y-6">
      <div className="h-12 bg-[var(--surface-card)] rounded-2xl" />
      <div className="h-12 bg-[var(--surface-card)] rounded-2xl" />
      <div className="h-12 bg-[var(--surface-card)] rounded-2xl" />
      <div className="h-10 bg-primary/20 rounded-2xl" />
    </div>
  ),
  ssr: false,
});

export default function StoryFormLoader() {
  return <StoryForm />;
}
