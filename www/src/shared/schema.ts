export interface User { id: string; username: string; password: string; }
export interface InsertUser { username: string; password: string; }

export interface Snippet { id: string; title: string; html: string; css: string; js: string; mode: string; }
export interface InsertSnippet { title: string; html: string; css: string; js: string; mode: string; }

export interface CustomAction { id: string; label: string; description: string; prompt: string; }
export interface InsertCustomAction { label: string; description: string; prompt: string; }

export interface Ementa { id: string; titulo: string; categoria: string; texto: string; }
export interface InsertEmenta { titulo: string; categoria: string; texto: string; }

export interface AiHistory {
  id: string; action: string; inputPreview: string; result: string;
  model?: string; provider?: string; inputTokens?: number; outputTokens?: number;
  estimatedCost?: number; chatHistory?: Array<{ role: string; content: string }>;
  createdAt: Date;
}
export interface InsertAiHistory {
  action: string; inputPreview: string; result: string;
  model?: string; provider?: string; inputTokens?: number; outputTokens?: number;
  estimatedCost?: number; chatHistory?: Array<{ role: string; content: string }>;
}

export interface PromptTemplate { id: string; titulo: string; categoria: string; texto: string; }
export interface InsertPromptTemplate { titulo: string; categoria: string; texto: string; }

export interface DocTemplate {
  id: string; titulo: string; categoria: string; conteudo: string;
  docxBase64?: string; docxFilename?: string;
}
export interface InsertDocTemplate { titulo: string; categoria: string; conteudo: string; docxBase64?: string; docxFilename?: string; }

export interface SharedParecer { id: string; token: string; titulo: string; conteudo: string; createdAt: Date; }

export interface ProcessoMonitorado {
  id: string; numeroProcesso: string; numero?: string; tribunal: string; descricao?: string;
  apelido?: string; status?: string; classe?: string; orgaoJulgador?: string;
  assuntos?: string; dataAjuizamento?: string;
  ultimoStatus?: string; ultimaMovimentacao?: string; ultimaMovimentacaoData?: string;
  monitoramentoAtivo: boolean; createdAt: Date;
}
export interface InsertProcessoMonitorado { numeroProcesso: string; tribunal: string; descricao?: string; }

export interface AppSetting { id: string; key: string; value: string; }

export interface TramitacaoPublicacao { id: string; [key: string]: any; }

export interface DjenCliente {
  id: string; nomeCompleto: string; email: string; tratamento: string;
  nomeCaso: string; numeroProcesso: string;
}
export interface InsertDjenCliente { nomeCompleto: string; email: string; tratamento: string; nomeCaso: string; numeroProcesso: string; }

export interface DjenPublicacao { id: string; [key: string]: any; }
export interface DjenExecucao { id: string; status: string; [key: string]: any; }

export interface Conversation { id: number; title: string; createdAt: Date; }
export interface Message { id: number; conversationId: number; role: string; content: string; createdAt: Date; }
