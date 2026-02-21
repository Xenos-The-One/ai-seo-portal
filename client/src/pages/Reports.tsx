import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, Zap, Cpu } from "lucide-react";

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

  // Model cost calculation (approximate costs per 1M tokens)
  const modelCosts: Record<string, { input: number; output: number; name: string }> = {
    "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0, name: "Claude 3.5 Sonnet" },
    "claude-3-5-haiku-20241022": { input: 0.8, output: 4.0, name: "Claude 3.5 Haiku" },
    "gpt-4o": { input: 2.5, output: 10.0, name: "GPT-4o" },
    "gpt-4o-mini": { input: 0.15, output: 0.6, name: "GPT-4o Mini" },
    "gemini-2.5-flash": { input: 0.075, output: 0.3, name: "Gemini 2.5 Flash" },
    "gemini-2.5-pro": { input: 1.25, output: 5.0, name: "Gemini 2.5 Pro" },
  };

  // Calculate cost by model
  const modelUsage = contentList?.reduce((acc, item) => {
    const model = item.content.aiModel || "gemini-2.5-flash";
    if (!acc[model]) {
      acc[model] = {
        count: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
      };
    }
    acc[model].count++;
    acc[model].inputTokens += item.content.inputTokens || 0;
    acc[model].outputTokens += item.content.outputTokens || 0;
    acc[model].totalTokens += item.content.totalTokens || 0;
    
    // Calculate cost
    const costs = modelCosts[model] || { input: 0, output: 0, name: model };
    acc[model].cost += 
      (item.content.inputTokens / 1000000) * costs.input +
      (item.content.outputTokens / 1000000) * costs.output;
    
    return acc;
  }, {} as Record<string, { count: number; inputTokens: number; outputTokens: number; totalTokens: number; cost: number }>);

  const totalEstimatedCost = Object.values(modelUsage || {}).reduce((sum, m) => sum + m.cost, 0);
  const modelUsageArray = Object.entries(modelUsage || {}).map(([model, data]) => ({
    model,
    name: modelCosts[model]?.name || model,
    ...data,
  })).sort((a, b) => b.cost - a.cost);

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
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estimated Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEstimatedCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on API pricing</p>
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

        {/* AI Model Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>AI Model Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {modelUsageArray.length > 0 ? (
              <div className="space-y-4">
                {modelUsageArray.map((model) => (
                  <div key={model.model} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{model.name}</span>
                      <span className="text-sm font-bold">${model.cost.toFixed(3)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{model.count} posts • {model.totalTokens.toLocaleString()} tokens</span>
                      <span>{((model.cost / totalEstimatedCost) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(model.cost / totalEstimatedCost) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
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

      {/* Model Performance Comparison */}
      <ModelPerformanceSection />
    </div>
  );
}

// Model Performance Comparison Component
function ModelPerformanceSection() {
  const { data: metrics } = trpc.modelPerformance.getMetrics.useQuery();

  if (!metrics || metrics.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Model Performance Comparison</h2>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              AI Model Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Model</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Approved</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Approval Rate</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Words</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Time</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total Cost</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Cost/Content</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Cost/Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr key={metric.model} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{metric.modelName}</p>
                          <p className="text-xs text-muted-foreground">{metric.model}</p>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-medium">{metric.totalContent}</td>
                      <td className="text-right py-3 px-4">{metric.approvedContent}</td>
                      <td className="text-right py-3 px-4">
                        <span
                          className={`font-medium ${
                            metric.approvalRate >= 80
                              ? "text-green-400"
                              : metric.approvalRate >= 50
                              ? "text-yellow-400"
                              : "text-red-400"
                          }`}
                        >
                          {metric.approvalRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">{Math.round(metric.avgWordCount)}</td>
                      <td className="text-right py-3 px-4">{(metric.avgGenerationTime / 1000).toFixed(1)}s</td>
                      <td className="text-right py-3 px-4">${metric.totalCost.toFixed(2)}</td>
                      <td className="text-right py-3 px-4">${metric.avgCostPerContent.toFixed(4)}</td>
                      <td className="text-right py-3 px-4">
                        {metric.approvedContent > 0 ? `$${metric.costPerApproval.toFixed(4)}` : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium mb-2">Key Insights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• <strong>Approval Rate:</strong> Higher is better - indicates content quality and client satisfaction</li>
                <li>• <strong>Cost/Approval:</strong> Lower is better - measures ROI per approved content piece</li>
                <li>• <strong>Avg Words:</strong> Longer content may rank better for SEO but costs more</li>
                <li>• <strong>Avg Time:</strong> Faster generation allows higher throughput</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
