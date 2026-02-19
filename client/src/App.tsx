import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Content from "./pages/Content";
import ContentDetail from "./pages/ContentDetail";
import Reports from "./pages/Reports";
import BulkGeneration from "./pages/BulkGeneration";
import Scheduling from "./pages/Scheduling";
import Templates from "./pages/Templates";
import Collaboration from "./pages/Collaboration";
import Analytics from "./pages/Analytics";
import Repurposing from "./pages/Repurposing";
import VersionHistory from "./pages/VersionHistory";
import QualityScore from "./pages/QualityScore";
import SeoAudit from "./pages/SeoAudit";
import ClientPortal from "./pages/ClientPortal";
import Publishing from "./pages/Publishing";
import Briefs from "./pages/Briefs";
import BriefForm from "./pages/BriefForm";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import ClientOnboarding from "./pages/ClientOnboarding";

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/clients" component={Clients} />
        <Route path="/clients/:id" component={ClientDetail} />
        <Route path="/content" component={Content} />
        <Route path="/content/:id" component={ContentDetail} />
        <Route path="/bulk" component={BulkGeneration} />
        <Route path="/scheduling" component={Scheduling} />
        <Route path="/templates" component={Templates} />
        <Route path="/collaboration" component={Collaboration} />
        <Route path="/version-history" component={VersionHistory} />
        <Route path="/quality-score" component={QualityScore} />
        <Route path="/seo-audit" component={SeoAudit} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/repurposing" component={Repurposing} />
        <Route path="/publishing" component={Publishing} />
        <Route path="/briefs" component={Briefs} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/client-portal" component={ClientPortal} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/onboarding" component={ClientOnboarding} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public brief submission form - no auth required */}
      <Route path="/brief/:token" component={BriefForm} />
      {/* All other routes go through dashboard layout */}
      <Route component={DashboardRouter} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
