import Link from 'next/link';
import StoryForm from '@/app/components/StoryForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">🌟</div>
          <h1 className="text-5xl font-extrabold text-amber-700 tracking-tight mb-2">
            Fabletime
          </h1>
          <p className="text-xl text-amber-600 font-medium">
            Magical stories, made just for you ✨
          </p>
          <p className="text-sm text-amber-500 mt-1">
            Pick your character, choose a theme, and watch your story come to life!
          </p>
        </div>

        {/* Form */}
        <StoryForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200 bg-amber-50 py-4">
        <div className="container mx-auto px-4 max-w-3xl flex items-center justify-center gap-4">
          <span className="text-sm text-amber-500">Have thoughts?</span>
          <Link
            href="/feedback"
            className="text-sm font-semibold text-blue-500 hover:text-blue-700 border border-blue-200 hover:border-blue-400 rounded-lg px-4 py-2 transition-colors"
          >
            💬 Give Feedback
          </Link>
          <Link
            href="/bug"
            className="text-sm font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg px-4 py-2 transition-colors"
          >
            🐛 Report a Bug
          </Link>
        </div>
      </footer>
    </div>
  );
}
