import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Eye, MousePointerClick, Share2, TrendingUp, BarChart3, Activity } from "lucide-react";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function Performance() {
  const [, setLocation] = useLocation();
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [dataSource, setDataSource] = useState<"internal" | "ga">("internal");
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: summary, isLoading: summaryLoading } = trpc.performance.getSummary.useQuery();
  const { data: topContent, isLoading: topLoading } = trpc.performance.getTopPerforming.useQuery({ limit: 10 });
  
  // Google Analytics data
  const { data: gaMetrics, isLoading: gaLoading } = trpc.googleAnalytics.getMetrics.useQuery(
    {
      clientId: selectedClient!,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    { enabled: dataSource === "ga" && selectedClient !== null }
  );
  
  const { data: gaPages, isLoading: gaPagesLoading } = trpc.googleAnalytics.getPageMetrics.useQuery(
    {
      clientId: selectedClient!,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      limit: 10,
    },
    { enabled: dataSource === "ga" && selectedClient !== null }
  );
  
  const isLoading = dataSource === "internal" 
    ? (summaryLoading || topLoading)
    : (gaLoading || gaPagesLoading);
  
  const displaySummary = dataSource === "ga" && gaMetrics
    ? {
        totalViews: gaMetrics.pageviews || 0,
        totalClicks: 0, // GA doesn't track clicks in the same way
        totalShares: 0,
        totalConversions: 0,
      }
    : summary;
  
  const displayContent = dataSource === "ga" && gaPages
    ? gaPages.map(page => ({
        content: {
          id: 0,
          title: page.pagePath,
          clientId: selectedClient!,
        },
        views: page.pageviews,
        clicks: 0,
        shares: 0,
        conversions: 0,
      }))
    : topContent;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Content Performance</h1>
            <p className="text-muted-foreground mt-2">
              Track views, clicks, and engagement across all your content
            </p>
          </div>
          <div className="flex gap-4">
            <Select value={dataSource} onValueChange={(v) => setDataSource(v as "internal" | "ga")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Internal Tracking
                  </div>
                </SelectItem>
                <SelectItem value="ga">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Google Analytics
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {dataSource === "ga" && (
              <Select
                value={selectedClient?.toString() || ""}
                onValueChange={(v) => setSelectedClient(parseInt(v))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Views</p>
              <p className="text-3xl font-bold mt-2">{displaySummary?.totalViews.toLocaleString() || 0}</p>
            </div>
            <Eye className="h-12 w-12 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
              <p className="text-3xl font-bold mt-2">{displaySummary?.totalClicks.toLocaleString() || 0}</p>
            </div>
            <MousePointerClick className="h-12 w-12 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
              <p className="text-3xl font-bold mt-2">{displaySummary?.totalShares.toLocaleString() || 0}</p>
            </div>
            <Share2 className="h-12 w-12 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversions</p>
              <p className="text-3xl font-bold mt-2">{displaySummary?.totalConversions.toLocaleString() || 0}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Top Performing Content */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Top Performing Content</h2>
        </div>

        {!displayContent || displayContent.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No performance data yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Performance metrics will appear here once content is published
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Title</th>
                  <th className="text-right py-3 px-4 font-semibold">Views</th>
                  <th className="text-right py-3 px-4 font-semibold">Clicks</th>
                  <th className="text-right py-3 px-4 font-semibold">Shares</th>
                  <th className="text-right py-3 px-4 font-semibold">Engagement</th>
                  <th className="text-right py-3 px-4 font-semibold">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {displayContent?.map((item, index) => (
                  <tr
                    key={'content' in item ? item.content.id : (item as any).id}
                    className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setLocation(`/content/${'content' in item ? item.content.id : (item as any).id}`)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">
                            {'content' in item ? item.content.title : (item as any).title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {dataSource === "ga" ? "Page" : (('topic' in item) ? (item as any).topic : "")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      {item.views?.toLocaleString() || 0}
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      {item.clicks?.toLocaleString() || 0}
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      {item.shares?.toLocaleString() || 0}
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      {('engagementRate' in item && item.engagementRate !== null) ? `${item.engagementRate}%` : "N/A"}
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      {item.conversions?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Average Engagement Rate</h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">
              {summary?.avgEngagementRate.toFixed(1) || 0}%
            </div>
            <p className="text-sm text-muted-foreground">
              Across {summary?.contentCount || 0} pieces of content
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Click-Through Rate</h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">
              {summary && summary.totalViews > 0
                ? ((summary.totalClicks / summary.totalViews) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground">
              {displaySummary?.totalClicks || 0} clicks from {displaySummary?.totalViews || 0} views
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
