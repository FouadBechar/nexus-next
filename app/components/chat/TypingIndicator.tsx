"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-gray-500">
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 delay-100" />
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 delay-200" />
    </div>
  );
}
