"use client";

import type { Model } from "../../types/model";

type ModelSelectorProps = {
  models: Model[];
  selectedModel: string;
  onChange: (model: string) => void;
};

export function ModelSelector({
  models,
  selectedModel,
  onChange,
}: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-3">
      <span className="text-sm text-gray-400">Model</span>

      <select
        value={selectedModel}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm outline-none"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
}
