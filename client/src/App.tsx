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
import ClientPortalWhitelabel from "./pages/ClientPortalWhitelabel";
import Publishing from "./pages/Publishing";
import Briefs from "./pages/Briefs";
import BriefForm from "./pages/BriefForm";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import ClientOnboarding from "./pages/ClientOnboarding";
import RecurringPlans from "./pages/RecurringPlans";
import ABTesting from "./pages/ABTesting";
import Calendar from "./pages/Calendar";
import KeywordResearch from "./pages/KeywordResearch";
import Approvals from "./pages/Approvals";
import Performance from "./pages/Performance";
import DesignStandards from "./pages/DesignStandards";
import PublishingAnalytics from "./pages/PublishingAnalytics";
import PortalLogin from "./pages/portal/PortalLogin";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalContent from "./pages/portal/PortalContent";
import PortalContentDetail from "./pages/portal/PortalContentDetail";
import PortalCalendar from "./pages/portal/PortalCalendar";
import PortalPerformance from "./pages/portal/PortalPerformance";
import CommandPalette from "./components/CommandPalette";

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
      <Route path="/client-view" component={ClientPortalWhitelabel} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/onboarding" component={ClientOnboarding} />
        <Route path="/recurring-plans" component={RecurringPlans} />
        <Route path="/ab-testing" component={ABTesting} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/keyword-research" component={KeywordResearch} />
        <Route path="/approvals" component={Approvals} />
        <Route path="/performance" component={Performance} />
        <Route path="/design-standards" component={DesignStandards} />
        <Route path="/publishing-analytics" component={PublishingAnalytics} />
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
      
      {/* Client Portal Routes - separate from agency dashboard */}
      <Route path="/portal/login" component={PortalLogin} />
      <Route path="/portal/dashboard" component={PortalDashboard} />
      <Route path="/portal/content/:id" component={PortalContentDetail} />
      <Route path="/portal/content" component={PortalContent} />
      <Route path="/portal/calendar" component={PortalCalendar} />
      <Route path="/portal/performance" component={PortalPerformance} />
      <Route path="/portal" component={() => { window.location.href = "/portal/login"; return null; }} />
      
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
          <CommandPalette />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
