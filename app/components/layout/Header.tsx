"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";

type HeaderProps = {
  isSignedIn?: boolean;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
};

export function Header({
  isSignedIn,
  onOpenSidebar,
  onOpenSettings,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-800 p-4">
      <div className="flex items-center gap-3">
        <button onClick={onOpenSidebar} className="text-xl lg:hidden">
          ☰
        </button>

        <h1 className="font-semibold">Nexus Next</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSettings}
          className="rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-900"
        >
          Settings
        </button>

        {!isSignedIn ? (
          <SignInButton mode="modal">
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm hover:bg-blue-700">
              Sign In
            </button>
          </SignInButton>
        ) : (
          <UserButton />
        )}
      </div>
    </div>
  );
}
