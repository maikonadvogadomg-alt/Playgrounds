import { QueryClient } from "@tanstack/react-query";
import { localDb } from "./local-db";

function jsonOk(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const path = url.replace(/\?.*$/, "");
  const m = method.toUpperCase();

  // Auth → sempre autenticado
  if (path.includes("/auth/check") || path.includes("/auth/")) {
    return jsonOk({ authenticated: true, passwordRequired: false });
  }

  // Dados locais (localStorage)
  if (m === "GET") {
    if (path === "/api/custom-actions")   return jsonOk(localDb.customActions.list());
    if (path === "/api/ementas")          return jsonOk(localDb.ementas.list());
    if (path === "/api/ai-history")       return jsonOk(localDb.aiHistory.list());
    if (path === "/api/prompt-templates") return jsonOk(localDb.promptTemplates.list());
    if (path === "/api/doc-templates")    return jsonOk(localDb.docTemplates.list());
  }
  if (m === "POST") {
    if (path === "/api/custom-actions")   return jsonOk(localDb.customActions.create(data));
    if (path === "/api/ementas")          return jsonOk(localDb.ementas.create(data));
    if (path === "/api/ai-history")       return jsonOk(localDb.aiHistory.create(data));
    if (path === "/api/prompt-templates") return jsonOk(localDb.promptTemplates.create(data));
    if (path === "/api/doc-templates")    return jsonOk(localDb.docTemplates.create(data));
  }
  if (m === "PATCH") {
    const caM = path.match(/^\/api\/custom-actions\/(.+)$/);
    if (caM) return jsonOk(localDb.customActions.update(caM[1], data));
    const emM = path.match(/^\/api\/ementas\/(.+)$/);
    if (emM) return jsonOk(localDb.ementas.update(emM[1], data));
    const ptM = path.match(/^\/api\/prompt-templates\/(.+)$/);
    if (ptM) return jsonOk(localDb.promptTemplates.update(ptM[1], data));
    const dtM = path.match(/^\/api\/doc-templates\/(.+)$/);
    if (dtM) return jsonOk(localDb.docTemplates.update(dtM[1], data));
  }
  if (m === "DELETE") {
    const caM = path.match(/^\/api\/custom-actions\/(.+)$/);
    if (caM) { localDb.customActions.delete(caM[1]); return jsonOk({ ok: true }); }
    const emM = path.match(/^\/api\/ementas\/(.+)$/);
    if (emM) { localDb.ementas.delete(emM[1]); return jsonOk({ ok: true }); }
    const ptM = path.match(/^\/api\/prompt-templates\/(.+)$/);
    if (ptM) { localDb.promptTemplates.delete(ptM[1]); return jsonOk({ ok: true }); }
    const dtM = path.match(/^\/api\/doc-templates\/(.+)$/);
    if (dtM) { localDb.docTemplates.delete(dtM[1]); return jsonOk({ ok: true }); }
    const ahM = path.match(/^\/api\/ai-history\/(.+)$/);
    if (ahM) { localDb.aiHistory.delete(ahM[1]); return jsonOk({ ok: true }); }
    if (path === "/api/ai-history") { localDb.aiHistory.deleteAll(); return jsonOk({ ok: true }); }
  }

  // Rotas desconhecidas → resposta vazia válida
  return jsonOk({ ok: true, data: [], items: [], results: [] });
}

export const getQueryFn =
  ({ on401 }: { on401: "returnNull" | "throw" }) =>
  async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const url = queryKey.join("/") as string;
    const res = await apiRequest("GET", url);
    if (on401 === "returnNull" && res.status === 401) return null;
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      throwOnError: false,
    },
    mutations: {
      retry: false,
      throwOnError: false,
    },
  },
});
