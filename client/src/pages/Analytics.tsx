import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Eye, MousePointerClick, Share2, Zap } from "lucide-react";
import { useState } from "react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Analytics() {
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const { data: contentList } = trpc.content.list.useQuery();
  const { data: metrics } = trpc.analytics.getMetrics.useQuery(
    { contentId: parseInt(selectedContentId) },
    { enabled: !!selectedContentId }
  );

  const selectedContent = contentList?.find(
    (c) => c.content.id === parseInt(selectedContentId)
  );

  // Calculate summary stats
  const totalViews = metrics?.reduce((sum: number, m: any) => sum + m.views, 0) || 0;
  const totalClicks = metrics?.reduce((sum: number, m: any) => sum + m.clicks, 0) || 0;
  const totalShares = metrics?.reduce((sum: number, m: any) => sum + m.shares, 0) || 0;
  const totalConversions = metrics?.reduce((sum: number, m: any) => sum + m.conversions, 0) || 0;
  const avgEngagement = metrics && metrics.length > 0
    ? Math.round(metrics.reduce((sum: number, m: any) => sum + m.engagementRate, 0) / metrics.length)
    : 0;

  const metricsData = [
    { name: "Views", value: totalViews, icon: Eye, color: "#3b82f6" },
    { name: "Clicks", value: totalClicks, icon: MousePointerClick, color: "#10b981" },
    { name: "Shares", value: totalShares, icon: Share2, color: "#f59e0b" },
    { name: "Conversions", value: totalConversions, icon: Zap, color: "#ef4444" },
  ];

  // Prepare chart data
  const chartData = metrics?.map((m: any, idx: number) => ({
    date: new Date(m.recordedAt).toLocaleDateString(),
    views: m.views,
    clicks: m.clicks,
    shares: m.shares,
    conversions: m.conversions,
    engagement: m.engagementRate,
  })) || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Content Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track performance metrics and engagement for your content
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Content</label>
        <Select value={selectedContentId} onValueChange={setSelectedContentId}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Choose content to analyze..." />
          </SelectTrigger>
          <SelectContent>
            {contentList?.map((item) => (
              <SelectItem
                key={item.content.id}
                value={item.content.id.toString()}
              >
                {item.content.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedContentId && selectedContent && (
        <>
          {/* Content Info */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">{selectedContent.content.title}</h3>
              <p className="text-sm text-muted-foreground">
                Created {new Date(selectedContent.content.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metricsData.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.name}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{metric.name}</p>
                        <p className="text-2xl font-bold mt-1">{metric.value}</p>
                      </div>
                      <Icon className="h-8 w-8 opacity-50" style={{ color: metric.color }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Engagement Rate */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Average Engagement Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{avgEngagement}%</p>
              <p className="text-sm text-muted-foreground mt-2">
                Based on {metrics?.length || 0} recorded metrics
              </p>
            </CardContent>
          </Card>

          {/* Charts */}
          {chartData.length > 0 && (
            <>
              {/* Line Chart - Performance Over Time */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Performance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#3b82f6" />
                      <Line type="monotone" dataKey="clicks" stroke="#10b981" />
                      <Line type="monotone" dataKey="shares" stroke="#f59e0b" />
                      <Line type="monotone" dataKey="conversions" stroke="#ef4444" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar Chart - Engagement */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="clicks" fill="#10b981" />
                      <Bar dataKey="shares" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {chartData.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  No analytics data available yet. Start tracking this content to see metrics.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedContentId && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Select a piece of content to view its analytics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
