"use client";

import type { Model } from "../../types/model";
import type { ChatSettings } from "../../types/settings";

type SettingsPanelProps = {
  models: Model[];
  open: boolean;
  settings: ChatSettings;
  onClose: () => void;
  onReset: () => void;
  onUpdate: (settings: Partial<ChatSettings>) => void;
};

export function SettingsPanel({
  models,
  open,
  settings,
  onClose,
  onReset,
  onUpdate,
}: SettingsPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/60 p-0 sm:items-center sm:justify-center sm:p-6">
      <button
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close settings"
      />

      <section className="relative max-h-[92vh] w-full overflow-y-auto border border-gray-800 bg-[#050816] p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="mt-1 text-sm text-gray-400">
              Tune model behavior for new messages.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-900"
          >
            Close
          </button>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-200">
              Model
            </span>
            <select
              value={settings.model}
              onChange={(event) => onUpdate({ model: event.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.provider}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-200">
                Temperature
              </span>
              <span className="font-mono text-sm text-gray-400">
                {settings.temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={(event) =>
                onUpdate({ temperature: Number(event.target.value) })
              }
              className="w-full accent-blue-500"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-200">
              System Prompt
            </span>
            <textarea
              value={settings.systemPrompt}
              onChange={(event) =>
                onUpdate({ systemPrompt: event.target.value })
              }
              rows={6}
              className="w-full resize-none rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-800 pt-5 sm:flex-row sm:justify-between">
          <button
            onClick={onReset}
            className="rounded-xl border border-gray-700 px-4 py-3 text-sm text-gray-300 hover:bg-gray-900"
          >
            Reset Defaults
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      </section>
    </div>
  );
}
