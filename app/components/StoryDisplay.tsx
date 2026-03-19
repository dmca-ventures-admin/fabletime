'use client';

interface StoryDisplayProps {
  story: string;
  isLoading: boolean;
}

export default function StoryDisplay({ story, isLoading }: StoryDisplayProps) {
  if (!story && !isLoading) return null;

  return (
    <div className="mt-8 w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-lg border-2 border-amber-200 p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">📖</span>
          <h2 className="text-xl font-bold text-amber-800">Your Story</h2>
          {isLoading && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-amber-600">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-bounce"></span>
            </span>
          )}
        </div>
        <div className="prose prose-amber max-w-none">
          {story.split('\n').map((paragraph, index) =>
            paragraph.trim() ? (
              <p
                key={index}
                className="text-gray-700 leading-relaxed text-lg mb-4 last:mb-0 font-serif"
              >
                {paragraph}
              </p>
            ) : null
          )}
          {isLoading && !story && (
            <p className="text-amber-400 italic animate-pulse text-lg font-serif">
              Once upon a time...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
