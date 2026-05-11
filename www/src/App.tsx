import { useState, Component } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaInstallBanner } from "@/components/pwa-install";
import { SettingsPanel } from "@/components/settings-panel";

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || "Erro desconhecido" };
  }
  componentDidCatch(error: any, info: any) {
    console.error("App crash:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#fefefe", color: "#1a1a1a", fontFamily: "system-ui",
          padding: "2rem", textAlign: "center"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Ops! Algo travou</h2>
          <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            Seu trabalho foi salvo automaticamente. Clique abaixo para voltar.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => this.setState({ hasError: false, error: "" })}
              style={{ background: "#3b82f6", color: "white", border: "none", padding: "0.75rem 2rem", borderRadius: "0.5rem", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}>
              Tentar novamente
            </button>
            <button onClick={() => window.location.reload()}
              style={{ background: "transparent", color: "#666", border: "1px solid #ccc", padding: "0.5rem 1.5rem", borderRadius: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import NotFound from "@/pages/not-found";
import Playground from "@/pages/playground";
import LegalAssistant from "@/pages/legal-assistant";
import Configuracoes from "@/pages/configuracoes";
import TokenGenerator from "@/pages/token-generator";
import ComparadorJuridico from "@/pages/comparador-juridico";
import AuditoriaFinanceira from "@/pages/auditoria-financeira";
import ConsultaProcessual from "@/pages/consulta-processual";
import PainelProcessos from "@/pages/painel-processos";
import ConsultaCorporativo from "@/pages/consulta-corporativo";
import ConsultaPdpj from "@/pages/consulta-pdpj";
import TramitacaoPage from "@/pages/tramitacao";
import FiltradorJuridico from "@/pages/filtrador";
import PrevidenciarioPage from "@/pages/previdenciario";
import RoboDjenPage from "@/pages/robo-djen";
import Jurisprudencia from "@/pages/jurisprudencia";
import ComunicacoesCnj from "@/pages/comunicacoes-cnj";
import CodeAssistant from "@/pages/code-assistant";
import CampoLivre from "@/pages/campo-livre";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CampoLivre} />
      <Route path="/juridico" component={LegalAssistant} />
      <Route path="/jurisprudencia" component={Jurisprudencia} />
      <Route path="/assistente">{() => <Redirect to="/juridico" />}</Route>
      <Route path="/playground" component={Playground} />
      <Route path="/token" component={TokenGenerator} />
      <Route path="/comparador" component={ComparadorJuridico} />
      <Route path="/auditoria" component={AuditoriaFinanceira} />
      <Route path="/consulta" component={ConsultaProcessual} />
      <Route path="/painel" component={PainelProcessos} />
      <Route path="/corporativo" component={ConsultaCorporativo} />
      <Route path="/pdpj" component={ConsultaPdpj} />
      <Route path="/tramitacao" component={TramitacaoPage} />
      <Route path="/filtrador" component={FiltradorJuridico} />
      <Route path="/previdenciario" component={PrevidenciarioPage} />
      <Route path="/robo-djen" component={RoboDjenPage} />
      <Route path="/comunicacoes" component={ComunicacoesCnj} />
      <Route path="/codigo" component={CodeAssistant} />
      <Route path="/campo-livre" component={CampoLivre} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const rawBase = import.meta.env.BASE_URL || "/";
  const basePath = (rawBase.startsWith(".") || rawBase === "/") ? undefined : rawBase.replace(/\/$/, "") || undefined;

  return (
    <WouterRouter base={basePath}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <PwaInstallBanner />
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
            <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </WouterRouter>
  );
}

export default App;
