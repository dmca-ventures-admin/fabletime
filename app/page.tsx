import StoryForm from '@/app/components/StoryForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <main className="container mx-auto px-4 py-12 max-w-3xl">
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
    </div>
  );
}
