import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Eye, MousePointerClick, Share2, TrendingUp, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

export default function Performance() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: summaryLoading } = trpc.performance.getSummary.useQuery();
  const { data: topContent, isLoading: topLoading } = trpc.performance.getTopPerforming.useQuery({ limit: 10 });

  if (summaryLoading || topLoading) {
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
        <h1 className="text-3xl font-bold text-foreground">Content Performance</h1>
        <p className="text-muted-foreground mt-2">
          Track views, clicks, and engagement across all your content
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Views</p>
              <p className="text-3xl font-bold mt-2">{summary?.totalViews.toLocaleString() || 0}</p>
            </div>
            <Eye className="h-12 w-12 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
              <p className="text-3xl font-bold mt-2">{summary?.totalClicks.toLocaleString() || 0}</p>
            </div>
            <MousePointerClick className="h-12 w-12 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
              <p className="text-3xl font-bold mt-2">{summary?.totalShares.toLocaleString() || 0}</p>
            </div>
            <Share2 className="h-12 w-12 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversions</p>
              <p className="text-3xl font-bold mt-2">{summary?.totalConversions.toLocaleString() || 0}</p>
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

        {!topContent || topContent.length === 0 ? (
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
                {topContent.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setLocation(`/content/${item.id}`)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.topic}</p>
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
                      {item.engagementRate || 0}%
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
              {summary?.totalClicks || 0} clicks from {summary?.totalViews || 0} views
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
