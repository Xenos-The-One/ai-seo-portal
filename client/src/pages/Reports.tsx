import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, Zap } from "lucide-react";

export default function Reports() {
  const { data: contentList } = trpc.content.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const totalTokens = contentList?.reduce((sum, item) => sum + item.content.totalTokens, 0) || 0;
  const totalContent = contentList?.length || 0;
  const totalClients = clients?.length || 0;
  const avgTokensPerContent = totalContent > 0 ? Math.round(totalTokens / totalContent) : 0;

  const statusBreakdown = {
    draft: contentList?.filter(item => item.content.status === "draft").length || 0,
    in_progress: contentList?.filter(item => item.content.status === "in_progress").length || 0,
    approved: contentList?.filter(item => item.content.status === "approved").length || 0,
  };

  const clientContentCounts = clients?.map(client => ({
    id: client.id,
    name: client.name,
    count: contentList?.filter(item => item.content.clientId === client.id).length || 0,
  })) || [];

  const topClients = clientContentCounts.sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your content generation and AI usage
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tokens Used
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Tokens/Content
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTokensPerContent.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Content
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Clients
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Content Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                  <span className="text-sm">Draft</span>
                </div>
                <span className="text-sm font-medium">{statusBreakdown.draft}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">In Progress</span>
                </div>
                <span className="text-sm font-medium">{statusBreakdown.in_progress}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Approved</span>
                </div>
                <span className="text-sm font-medium">{statusBreakdown.approved}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clients by Content</CardTitle>
          </CardHeader>
          <CardContent>
            {topClients.length > 0 ? (
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <span className="text-sm">{client.name}</span>
                    </div>
                    <span className="text-sm font-medium">{client.count} posts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Token Usage by Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Content Token Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {contentList && contentList.length > 0 ? (
              <div className="space-y-3">
                {contentList.slice(0, 10).map((item) => (
                  <div
                    key={item.content.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.content.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.client?.name || "Unknown Client"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.content.totalTokens}</p>
                        <p className="text-xs text-muted-foreground">tokens</p>
                      </div>
                      {item.content.webSearches > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.content.urlsFetched}</p>
                          <p className="text-xs text-muted-foreground">URLs</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No content data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
