"use client";

import type { Model } from "../../types/model";
import {
  getModelCapabilityBadges,
  getModelProviderHint,
} from "../../../lib/ai/models";

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
  const activeModel = models.find((model) => model.id === selectedModel);

  return (
    <div className="border-b border-gray-800 bg-gray-900 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-400">Model</span>

        <select
          value={selectedModel}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm outline-none"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} - {model.provider}
            </option>
          ))}
        </select>

        {activeModel && (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {getModelCapabilityBadges(activeModel).map((badge) => (
              <CapabilityBadge
                key={badge.label}
                label={badge.label}
                tone={badge.tone}
              />
            ))}
          </div>
        )}
      </div>

      {activeModel && (
        <p className="mt-2 text-xs text-gray-500">
          {getModelProviderHint(activeModel)}
        </p>
      )}
    </div>
  );
}

function CapabilityBadge({
  label,
  tone,
}: {
  label: string;
  tone: "default" | "success" | "muted";
}) {
  const className =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "muted"
        ? "border-gray-700 bg-gray-800 text-gray-400"
        : "border-blue-500/30 bg-blue-500/10 text-blue-200";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs ${className}`}>
      {label}
    </span>
  );
}
