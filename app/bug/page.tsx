import IssueForm from '@/app/components/IssueForm';

export const metadata = { title: 'Report a Bug — Fabletime' };

export default function BugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <main className="container mx-auto px-4 py-12 max-w-xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐛</div>
          <h1 className="text-3xl font-extrabold text-amber-700 mb-2">Report a Bug</h1>
          <p className="text-amber-600">Something not working right? Let us know and we'll fix it.</p>
        </div>
        <div className="bg-white rounded-3xl shadow-lg border-2 border-red-200 p-8">
          <IssueForm type="bug" />
        </div>
      </main>
    </div>
  );
}
