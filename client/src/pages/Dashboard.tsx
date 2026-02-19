import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  CheckCircle2,
  TrendingUp,
  Clock,
  Zap,
  GripVertical,
  Settings2,
  Eye,
  EyeOff,
  RotateCcw,
  BarChart3,
  Calendar,
  Target,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Widget definitions
type WidgetId =
  | "stats"
  | "quickActions"
  | "recentActivity"
  | "statusBreakdown"
  | "topClients"
  | "tokenUsage"
  | "upcomingScheduled"
  | "contentPipeline";

interface WidgetConfig {
  id: WidgetId;
  title: string;
  icon: typeof Users;
  description: string;
  defaultVisible: boolean;
  size: "full" | "half";
}

const WIDGET_DEFINITIONS: WidgetConfig[] = [
  { id: "stats", title: "Overview Stats", icon: BarChart3, description: "Key metrics at a glance", defaultVisible: true, size: "full" },
  { id: "quickActions", title: "Quick Actions", icon: Zap, description: "Common shortcuts", defaultVisible: true, size: "half" },
  { id: "recentActivity", title: "Recent Activity", icon: Clock, description: "Latest content updates", defaultVisible: true, size: "half" },
  { id: "statusBreakdown", title: "Status Breakdown", icon: Target, description: "Content by status", defaultVisible: true, size: "half" },
  { id: "topClients", title: "Top Clients", icon: Users, description: "Clients by content count", defaultVisible: true, size: "half" },
  { id: "tokenUsage", title: "Token Usage Summary", icon: TrendingUp, description: "AI token consumption", defaultVisible: true, size: "half" },
  { id: "upcomingScheduled", title: "Upcoming Scheduled", icon: Calendar, description: "Scheduled content", defaultVisible: true, size: "half" },
  { id: "contentPipeline", title: "Content Pipeline", icon: FileText, description: "Draft to approved flow", defaultVisible: false, size: "full" },
];

const STORAGE_KEY = "dashboard-widget-config";

interface DashboardState {
  order: WidgetId[];
  hidden: WidgetId[];
}

function getDefaultState(): DashboardState {
  return {
    order: WIDGET_DEFINITIONS.map((w) => w.id),
    hidden: WIDGET_DEFINITIONS.filter((w) => !w.defaultVisible).map((w) => w.id),
  };
}

function loadState(): DashboardState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all widgets are in the order array
      const allIds = WIDGET_DEFINITIONS.map((w) => w.id);
      const existingOrder = (parsed.order || []).filter((id: string) => allIds.includes(id as WidgetId));
      const missingIds = allIds.filter((id) => !existingOrder.includes(id));
      return {
        order: [...existingOrder, ...missingIds] as WidgetId[],
        hidden: parsed.hidden || [],
      };
    }
  } catch {}
  return getDefaultState();
}

function saveState(state: DashboardState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function Dashboard() {
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: contentList } = trpc.content.list.useQuery();

  const [dashState, setDashState] = useState<DashboardState>(loadState);
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);
  const [dragOverWidget, setDragOverWidget] = useState<WidgetId | null>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    saveState(dashState);
  }, [dashState]);

  const totalClients = clients?.length || 0;
  const totalContent = contentList?.length || 0;
  const approvedContent = contentList?.filter((item) => item.content.status === "approved").length || 0;
  const draftContent = contentList?.filter((item) => item.content.status === "draft").length || 0;
  const inProgressContent = contentList?.filter((item) => item.content.status === "in_progress").length || 0;
  const recentContent = contentList?.slice(0, 5) || [];

  const totalTokens = useMemo(() => {
    if (!contentList) return { input: 0, output: 0, total: 0 };
    return contentList.reduce(
      (acc, item) => ({
        input: acc.input + (item.content.inputTokens || 0),
        output: acc.output + (item.content.outputTokens || 0),
        total: acc.total + (item.content.totalTokens || 0),
      }),
      { input: 0, output: 0, total: 0 }
    );
  }, [contentList]);

  const clientContentCounts = useMemo(() => {
    if (!contentList || !clients) return [];
    const counts: Record<number, { name: string; count: number }> = {};
    contentList.forEach((item) => {
      const clientId = item.content.clientId;
      const clientName = item.client?.name || "Unknown";
      if (!counts[clientId]) counts[clientId] = { name: clientName, count: 0 };
      counts[clientId].count++;
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [contentList, clients]);

  const scheduledContent = useMemo(() => {
    if (!contentList) return [];
    return contentList
      .filter((item) => (item.content as any).isScheduled && (item.content as any).scheduledDate)
      .sort((a, b) => {
        const dateA = (a.content as any).scheduledDate ? new Date((a.content as any).scheduledDate).getTime() : 0;
        const dateB = (b.content as any).scheduledDate ? new Date((b.content as any).scheduledDate).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [contentList]);

  const toggleWidget = useCallback((id: WidgetId) => {
    setDashState((prev) => ({
      ...prev,
      hidden: prev.hidden.includes(id) ? prev.hidden.filter((h) => h !== id) : [...prev.hidden, id],
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setDashState(getDefaultState());
  }, []);

  const visibleWidgets = dashState.order.filter((id) => !dashState.hidden.includes(id));

  const handleDragStart = useCallback((e: React.DragEvent, widgetId: WidgetId) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", widgetId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnter = useCallback((widgetId: WidgetId) => {
    dragCounter.current++;
    setDragOverWidget(widgetId);
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverWidget(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: WidgetId) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragOverWidget(null);
      setDraggedWidget(null);

      if (!draggedWidget || draggedWidget === targetId) return;

      setDashState((prev) => {
        const newOrder = [...prev.order];
        const fromIndex = newOrder.indexOf(draggedWidget);
        const toIndex = newOrder.indexOf(targetId);
        if (fromIndex === -1 || toIndex === -1) return prev;
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, draggedWidget);
        return { ...prev, order: newOrder };
      });
    },
    [draggedWidget]
  );

  const handleDragEnd = useCallback(() => {
    dragCounter.current = 0;
    setDraggedWidget(null);
    setDragOverWidget(null);
  }, []);

  // Render individual widgets
  const renderWidget = (widgetId: WidgetId) => {
    const config = WIDGET_DEFINITIONS.find((w) => w.id === widgetId)!;
    const isDragging = draggedWidget === widgetId;
    const isDragOver = dragOverWidget === widgetId;

    const wrapperClass = `${config.size === "full" ? "col-span-1 lg:col-span-2" : "col-span-1"} transition-all duration-200 ${
      isDragging ? "opacity-40 scale-95" : ""
    } ${isDragOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg" : ""}`;

    return (
      <div
        key={widgetId}
        className={wrapperClass}
        draggable
        onDragStart={(e) => handleDragStart(e, widgetId)}
        onDragOver={handleDragOver}
        onDragEnter={() => handleDragEnter(widgetId)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, widgetId)}
        onDragEnd={handleDragEnd}
      >
        {widgetId === "stats" && <StatsWidget totalClients={totalClients} totalContent={totalContent} approvedContent={approvedContent} draftContent={draftContent} />}
        {widgetId === "quickActions" && <QuickActionsWidget />}
        {widgetId === "recentActivity" && <RecentActivityWidget recentContent={recentContent} />}
        {widgetId === "statusBreakdown" && <StatusBreakdownWidget draft={draftContent} inProgress={inProgressContent} approved={approvedContent} total={totalContent} />}
        {widgetId === "topClients" && <TopClientsWidget clients={clientContentCounts} />}
        {widgetId === "tokenUsage" && <TokenUsageWidget tokens={totalTokens} />}
        {widgetId === "upcomingScheduled" && <UpcomingScheduledWidget items={scheduledContent} />}
        {widgetId === "contentPipeline" && <ContentPipelineWidget draft={draftContent} inProgress={inProgressContent} approved={approvedContent} />}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to your AI-powered content management platform</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Customize
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-1.5 text-sm font-semibold">Toggle Widgets</div>
            {WIDGET_DEFINITIONS.map((widget) => (
              <DropdownMenuCheckboxItem
                key={widget.id}
                checked={!dashState.hidden.includes(widget.id)}
                onCheckedChange={() => toggleWidget(widget.id)}
              >
                <div className="flex items-center gap-2">
                  <widget.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{widget.title}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetLayout} className="gap-2 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
        <GripVertical className="h-3 w-3" /> Drag widgets to reorder
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleWidgets.map((id) => renderWidget(id))}
      </div>

      {visibleWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <EyeOff className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">All widgets are hidden</p>
          <p className="text-sm mt-1">Click "Customize" to show widgets</p>
        </div>
      )}
    </div>
  );
}

// ---- Widget Components ----

function StatsWidget({ totalClients, totalContent, approvedContent, draftContent }: { totalClients: number; totalContent: number; approvedContent: number; draftContent: number }) {
  const stats = [
    { label: "Total Clients", value: totalClients, icon: Users, color: "text-blue-400" },
    { label: "Total Content", value: totalContent, icon: FileText, color: "text-purple-400" },
    { label: "Approved", value: approvedContent, icon: CheckCircle2, color: "text-green-400" },
    { label: "Drafts", value: draftContent, icon: TrendingUp, color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="cursor-grab active:cursor-grabbing">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickActionsWidget() {
  return (
    <Card className="cursor-grab active:cursor-grabbing">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/content">
          <Button className="w-full gap-2" size="sm">
            <Zap className="h-4 w-4" />
            Generate Content
          </Button>
        </Link>
        <Link href="/onboarding">
          <Button variant="outline" className="w-full gap-2" size="sm">
            <Users className="h-4 w-4" />
            Onboard Client
          </Button>
        </Link>
        <Link href="/bulk">
          <Button variant="outline" className="w-full gap-2" size="sm">
            <FileText className="h-4 w-4" />
            Bulk Generate
          </Button>
        </Link>
        <Link href="/scheduling">
          <Button variant="outline" className="w-full gap-2" size="sm">
            <Calendar className="h-4 w-4" />
            Schedule Content
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function RecentActivityWidget({ recentContent }: { recentContent: Array<{ content: { id: number; title: string; status: string }; client: { name: string } | null }> }) {
  return (
    <Card className="cursor-grab active:cursor-grabbing">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {recentContent.length > 0 ? (
          <div className="space-y-2">
            {recentContent.map((item) => (
              <Link key={item.content.id} href={`/content/${item.content.id}`}>
                <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.content.title}</p>
                    <p className="text-xs text-muted-foreground">{item.client?.name || "Unknown"}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      item.content.status === "approved"
                        ? "bg-green-500/10 text-green-400"
                        : item.content.status === "in_progress"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.content.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No content yet</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBreakdownWidget({ draft, inProgress, approved, total }: { draft: number; inProgress: number; approved: number; total: number }) {
  const items = [
    { label: "Draft", count: draft, color: "bg-muted-foreground" },
    { label: "In Progress", count: inProgress, color: "bg-blue-500" },
    { label: "Approved", count: approved, color: "bg-green-500" },
  ];

  return (
    <Card className="cursor-grab active:cursor-grabbing">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <CardTitle className="text-base">Status Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">
                    {item.count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TopClientsWidget({ clients }: { clients: Array<{ name: string; count: number }> }) {
  return (
    <Card className="cursor-grab active:cursor-grabbing">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <CardTitle className="text-base">Top Clients</CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length > 0 ? (
          <div className="space-y-2.5">
            {clients.map((client, idx) => (
              <div key={`${client.name}-${idx}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">#{idx + 1}</span>
                  <span className="text-sm font-medium">{client.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{client.count} posts</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No client data yet</p>
        )}
      </CardContent>
    </Card>
  );
}

function TokenUsageWidget({ tokens }: { tokens: { input: number; output: number; total: number } }) {
  return (
    <Card className="cursor-grab active:cursor-grabbing">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <CardTitle className="text-base">Token Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Input Tokens</span>
            <span className="text-sm font-medium">{tokens.input.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Output Tokens</span>
            <span className="text-sm font-medium">{tokens.output.toLocaleString()}</span>
          </div>
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
            <span className="text-sm font-bold text-primary">{tokens.total.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingScheduledWidget({ items }: { items: Array<{ content: { id: number; title: string; scheduledDate?: Date | null }; client: { name: string } | null }> }) {
  return (
    <Card className="cursor-grab active:cursor-grabbing">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <CardTitle className="text-base">Upcoming Scheduled</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <Link key={item.content.id} href={`/content/${item.content.id}`}>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.content.title}</p>
                    <p className="text-xs text-muted-foreground">{item.client?.name || "Unknown"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {item.content.scheduledDate ? new Date(item.content.scheduledDate).toLocaleDateString() : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No scheduled content</p>
        )}
      </CardContent>
    </Card>
  );
}

function ContentPipelineWidget({ draft, inProgress, approved }: { draft: number; inProgress: number; approved: number }) {
  const total = draft + inProgress + approved;
  return (
    <Card className="cursor-grab active:cursor-grabbing">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <CardTitle className="text-base">Content Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Pipeline stages */}
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 text-center">
              <div className="bg-muted rounded-lg p-4">
                <div className="text-2xl font-bold">{draft}</div>
                <div className="text-xs text-muted-foreground mt-1">Draft</div>
              </div>
            </div>
            <div className="text-muted-foreground text-lg">→</div>
            <div className="flex-1 text-center">
              <div className="bg-blue-500/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{inProgress}</div>
                <div className="text-xs text-muted-foreground mt-1">In Progress</div>
              </div>
            </div>
            <div className="text-muted-foreground text-lg">→</div>
            <div className="flex-1 text-center">
              <div className="bg-green-500/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{approved}</div>
                <div className="text-xs text-muted-foreground mt-1">Approved</div>
              </div>
            </div>
          </div>
        </div>
        {total > 0 && (
          <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden flex">
            <div className="bg-muted-foreground h-full transition-all" style={{ width: `${(draft / total) * 100}%` }} />
            <div className="bg-blue-500 h-full transition-all" style={{ width: `${(inProgress / total) * 100}%` }} />
            <div className="bg-green-500 h-full transition-all" style={{ width: `${(approved / total) * 100}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
