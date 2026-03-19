import IssueForm from '@/app/components/IssueForm';

export const metadata = { title: 'Feedback — Fabletime' };

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <main className="container mx-auto px-4 py-12 max-w-xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💬</div>
          <h1 className="text-3xl font-extrabold text-amber-700 mb-2">Share Feedback</h1>
          <p className="text-amber-600">We'd love to hear what you think about Fabletime!</p>
        </div>
        <div className="bg-white rounded-3xl shadow-lg border-2 border-blue-200 p-8">
          <IssueForm type="feedback" />
        </div>
      </main>
    </div>
  );
}
