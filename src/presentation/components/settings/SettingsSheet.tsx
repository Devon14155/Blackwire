import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useChatStore } from "@presentation/state/chatStore";
import type { ModelPreset } from "@domain/entities/ModelSettings";
import { cn } from "@presentation/lib/cn";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const presets: { label: string; value: ModelPreset; description: string }[] = [
  { label: "OpenAI Compatible", value: "openai", description: "Any API supporting the OpenAI /chat/completions schema." },
  { label: "Azure OpenAI", value: "azure", description: "Azure-hosted GPT deployments with api-key header." },
  { label: "Anthropic", value: "anthropic", description: "Claude models using the Messages API." },
  { label: "Ollama", value: "ollama", description: "Self-hosted Ollama server." },
  { label: "Custom", value: "custom", description: "Define your own endpoint, method, and payload template." }
];

const Panel = ({ children }: { children: ReactNode }) => (
  <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg backdrop-blur">
    {children}
  </div>
);

export const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
  const settings = useChatStore((state) => state.settings);
  const updateSettings = useChatStore((state) => state.updateSettings);
  const persistSettings = useChatStore((state) => state.persistSettings);
  const [headers, setHeaders] = useState("{}\n");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) {
      return;
    }
    setHeaders(JSON.stringify(settings.customHeaders ?? {}, null, 2));
  }, [settings?.id]);

  const handlePresetChange = (preset: ModelPreset) => {
    if (!settings) {
      return;
    }
    const defaults: Partial<typeof settings> = {};
    switch (preset) {
      case "openai":
        defaults.endpoint = "https://api.openai.com/v1/chat/completions";
        defaults.apiKeyHeader = "Authorization";
        defaults.stream = true;
        break;
      case "azure":
        defaults.apiKeyHeader = "api-key";
        defaults.stream = true;
        break;
      case "anthropic":
        defaults.endpoint = "https://api.anthropic.com/v1/messages";
        defaults.apiKeyHeader = "x-api-key";
        defaults.stream = true;
        defaults.customHeaders = { "anthropic-version": "2023-06-01" };
        break;
      case "ollama":
        defaults.endpoint = "http://127.0.0.1:11434/api/chat";
        defaults.apiKeyHeader = "";
        defaults.stream = true;
        defaults.customHeaders = {};
        break;
      case "custom":
        defaults.stream = false;
        break;
      default:
        break;
    }
    const mergedHeaders = defaults.customHeaders ?? settings.customHeaders ?? {};
    setHeaders(JSON.stringify(mergedHeaders, null, 2));
    updateSettings({ preset, ...defaults, customHeaders: mergedHeaders });
  };

  const handleSave = async () => {
    if (!settings) {
      return;
    }
    try {
      const parsed = headers.trim() ? JSON.parse(headers) : {};
      updateSettings({ customHeaders: parsed });
      setError(null);
      await persistSettings();
      onOpenChange(false);
    } catch (parseError) {
      setError("Headers must be valid JSON");
    }
  };

  const sheetClasses = useMemo(
    () =>
      cn(
        "fixed inset-y-0 right-0 z-50 w-full max-w-xl transform bg-[#07080b]/95 p-8 text-sm text-white shadow-2xl transition duration-300",
        open
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "translate-x-full opacity-0 pointer-events-none"
      ),
    [open]
  );

  if (!settings) {
    return (
      <div className={sheetClasses} aria-hidden={!open}>
        <div className="flex h-full items-center justify-center text-white/60">Loading…</div>
      </div>
    );
  }

  return (
    <div className={sheetClasses} aria-hidden={!open}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Model orchestration</h2>
          <p className="text-xs text-white/40">Bring your API endpoint to integrate with the console.</p>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 transition hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="mt-8 space-y-6 overflow-y-auto pr-2" style={{ maxHeight: "calc(100vh - 10rem)" }}>
        <Panel>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Preset</p>
          <div className="mt-3 grid gap-2">
            {presets.map((presetOption) => {
              const active = settings?.preset === presetOption.value;
              return (
                <button
                  key={presetOption.value}
                  onClick={() => handlePresetChange(presetOption.value)}
                  className={cn(
                    "flex flex-col rounded-xl border px-4 py-3 text-left transition",
                    active
                      ? "border-highlight bg-highlight/10 text-white"
                      : "border-white/10 text-white/70 hover:border-highlight/60 hover:text-white"
                  )}
                >
                  <span className="text-sm font-semibold">{presetOption.label}</span>
                  <span className="text-xs text-white/40">{presetOption.description}</span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-white/40">Endpoint</span>
            <input
              value={settings?.endpoint ?? ""}
              onChange={(event) => updateSettings({ endpoint: event.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
              placeholder="https://api.example.com/v1/chat"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-white/40">Model identifier</span>
            <input
              value={settings?.model ?? ""}
              onChange={(event) => updateSettings({ model: event.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
              placeholder="gpt-4o-mini"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-white/40">API key</span>
              <input
                value={settings?.apiKey ?? ""}
                onChange={(event) => updateSettings({ apiKey: event.target.value })}
                type="password"
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-white/40">API key header</span>
              <input
                value={settings?.apiKeyHeader ?? ""}
                onChange={(event) => updateSettings({ apiKeyHeader: event.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-white/40">Organization (optional)</span>
              <input
                value={settings?.organization ?? ""}
                onChange={(event) => updateSettings({ organization: event.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-white/40">HTTP method</span>
              <select
                value={settings?.httpMethod ?? "POST"}
                onChange={(event) => updateSettings({ httpMethod: event.target.value as "POST" | "GET" })}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </label>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40">Temperature</p>
              <p className="text-xs text-white/50">Controls randomness of responses.</p>
            </div>
            <span className="text-sm font-semibold text-white/90">{settings?.temperature?.toFixed(2) ?? "0.00"}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings?.temperature ?? 0}
            onChange={(event) => updateSettings({ temperature: Number(event.target.value) })}
            className="w-full"
          />
          <label className="flex items-center gap-3 text-xs text-white/70">
            <input
              type="checkbox"
              checked={settings?.stream ?? false}
              onChange={(event) => updateSettings({ stream: event.target.checked })}
              className="h-4 w-4 rounded border border-white/20 bg-black"
            />
            Stream responses when supported
          </label>
        </Panel>

        {settings?.preset === "custom" && (
          <Panel>
            <p className="text-xs uppercase tracking-widest text-white/40">Custom body template</p>
            <textarea
              value={settings?.customBodyTemplate ?? ""}
              onChange={(event) => updateSettings({ customBodyTemplate: event.target.value })}
              rows={6}
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-white focus:border-highlight focus:outline-none"
              placeholder='{"prompt":"{{prompt}}","messages":{{messages}},"model":"{{model}}"}'
            />
            <p className="text-[10px] text-white/40">Available tokens: {{'{{prompt}}'}}, {{'{{messages}}'}}, {{'{{model}}'}}.</p>
          </Panel>
        )}

        <Panel>
          <p className="text-xs uppercase tracking-widest text-white/40">Additional headers</p>
          <textarea
            value={headers}
            onChange={(event) => setHeaders(event.target.value)}
            rows={6}
            className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs text-white focus:border-highlight focus:outline-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </Panel>
      </div>

      <div className="mt-6 flex justify-between border-t border-white/10 pt-4">
        <button
          onClick={() => onOpenChange(false)}
          className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="rounded-full bg-highlight px-6 py-2 text-sm font-semibold text-black shadow-glow transition hover:scale-105"
        >
          Save configuration
        </button>
      </div>
    </div>
  );
};
