function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const localDb = {
  customActions: {
    list: () => read<any>("db_custom_actions"),
    create: (d: any) => { const r = { ...d, id: uuid() }; const a = read<any>("db_custom_actions"); save("db_custom_actions", [...a, r]); return r; },
    update: (id: string, d: any) => { const a = read<any>("db_custom_actions").map((x: any) => x.id === id ? { ...x, ...d } : x); save("db_custom_actions", a); return a.find((x: any) => x.id === id); },
    delete: (id: string) => { save("db_custom_actions", read<any>("db_custom_actions").filter((x: any) => x.id !== id)); },
  },
  ementas: {
    list: () => read<any>("db_ementas"),
    create: (d: any) => { const r = { ...d, id: uuid() }; const a = read<any>("db_ementas"); save("db_ementas", [...a, r]); return r; },
    update: (id: string, d: any) => { const a = read<any>("db_ementas").map((x: any) => x.id === id ? { ...x, ...d } : x); save("db_ementas", a); return a.find((x: any) => x.id === id); },
    delete: (id: string) => { save("db_ementas", read<any>("db_ementas").filter((x: any) => x.id !== id)); },
  },
  aiHistory: {
    list: () => read<any>("db_ai_history").map((x: any) => ({ ...x, createdAt: x.createdAt || new Date().toISOString() })),
    create: (d: any) => { const r = { ...d, id: uuid(), createdAt: new Date().toISOString() }; const a = read<any>("db_ai_history"); save("db_ai_history", [r, ...a].slice(0, 200)); return r; },
    delete: (id: string) => { save("db_ai_history", read<any>("db_ai_history").filter((x: any) => x.id !== id)); },
    deleteAll: () => { save("db_ai_history", []); },
  },
  promptTemplates: {
    list: () => read<any>("db_prompt_templates"),
    create: (d: any) => { const r = { ...d, id: uuid() }; const a = read<any>("db_prompt_templates"); save("db_prompt_templates", [...a, r]); return r; },
    update: (id: string, d: any) => { const a = read<any>("db_prompt_templates").map((x: any) => x.id === id ? { ...x, ...d } : x); save("db_prompt_templates", a); return a.find((x: any) => x.id === id); },
    delete: (id: string) => { save("db_prompt_templates", read<any>("db_prompt_templates").filter((x: any) => x.id !== id)); },
  },
  docTemplates: {
    list: () => read<any>("db_doc_templates"),
    create: (d: any) => { const r = { ...d, id: uuid() }; const a = read<any>("db_doc_templates"); save("db_doc_templates", [...a, r]); return r; },
    update: (id: string, d: any) => { const a = read<any>("db_doc_templates").map((x: any) => x.id === id ? { ...x, ...d } : x); save("db_doc_templates", a); return a.find((x: any) => x.id === id); },
    delete: (id: string) => { save("db_doc_templates", read<any>("db_doc_templates").filter((x: any) => x.id !== id)); },
  },
  aiConfig: {
    get: (): Record<string, string> => { try { return JSON.parse(localStorage.getItem("ai_config") || "{}"); } catch { return {}; } },
    set: (cfg: Record<string, string>) => { localStorage.setItem("ai_config", JSON.stringify(cfg)); },
    getKey: (k: string): string => { const c = localDb.aiConfig.get(); return c[k] || ""; },
    setKey: (k: string, v: string) => { const c = localDb.aiConfig.get(); c[k] = v; localDb.aiConfig.set(c); },
  },
};
