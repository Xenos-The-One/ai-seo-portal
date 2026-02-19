import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Plus,
  Trash2,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Webhook,
  ExternalLink,
  RefreshCw,
  Zap,
  Eye,
  Info,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const platformConfig: Record<string, { label: string; color: string; icon: string; description: string; urlHint: string; authHint: string }> = {
  wordpress: {
    label: "WordPress",
    color: "bg-blue-500/20 text-blue-400",
    icon: "W",
    description: "WordPress REST API v2. Posts are created as drafts with SEO meta, excerpts, and slugs.",
    urlHint: "https://yoursite.com/wp-json/wp/v2/posts",
    authHint: "Use Application Password: Basic base64(user:app_password) or JWT Bearer token",
  },
  ghost: {
    label: "Ghost",
    color: "bg-purple-500/20 text-purple-400",
    icon: "G",
    description: "Ghost Admin API. Posts include HTML content, feature images, tags, and SEO metadata.",
    urlHint: "https://yoursite.com/ghost/api/admin/posts/",
    authHint: "Admin API Key in id:secret format, or use custom auth header",
  },
  webflow: {
    label: "Webflow",
    color: "bg-indigo-500/20 text-indigo-400",
    icon: "Wf",
    description: "Webflow CMS API v2. Items are created with fieldData including body, summary, and images.",
    urlHint: "https://api.webflow.com/v2/collections/{collection_id}/items",
    authHint: "Webflow API Bearer token from site settings",
  },
  custom: {
    label: "Custom API",
    color: "bg-gray-500/20 text-gray-400",
    icon: "C",
    description: "Generic JSON POST. Sends title, content (markdown + HTML), image URL, and metadata.",
    urlHint: "https://api.example.com/posts",
    authHint: "Bearer token or custom Authorization header",
  },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  success: { label: "Published", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400", icon: XCircle },
};

export default function Publishing() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [selectedWebhookId, setSelectedWebhookId] = useState<string>("");
  const [publishAsDraft, setPublishAsDraft] = useState(true);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [newWebhook, setNewWebhook] = useState({
    clientId: "",
    name: "",
    platform: "wordpress" as "wordpress" | "ghost" | "webflow" | "custom",
    endpointUrl: "",
    apiKey: "",
    authHeader: "",
  });

  const { data: webhooks, refetch: refetchWebhooks } = trpc.webhooks.list.useQuery();
  const { data: contentList } = trpc.content.list.useQuery();
  const { data: clientsList } = trpc.clients.list.useQuery();
  const { data: publishLogs, refetch: refetchLogs } = trpc.webhooks.getLogs.useQuery(
    { contentId: parseInt(selectedContentId) },
    { enabled: !!selectedContentId && !isNaN(parseInt(selectedContentId)) }
  );
  const { data: payloadPreview } = trpc.webhooks.previewPayload.useQuery(
    { contentId: parseInt(selectedContentId), webhookId: parseInt(selectedWebhookId) },
    { enabled: showPreviewDialog && !!selectedContentId && !!selectedWebhookId }
  );

  const createMutation = trpc.webhooks.create.useMutation();
  const deleteMutation = trpc.webhooks.delete.useMutation();
  const publishMutation = trpc.webhooks.publish.useMutation();
  const testMutation = trpc.webhooks.testConnection.useMutation();

  const approvedContent = useMemo(
    () => contentList?.filter((c) => c.content.status === "approved") || [],
    [contentList]
  );

  const currentPlatform = platformConfig[newWebhook.platform];

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.endpointUrl || !newWebhook.clientId) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createMutation.mutateAsync({
        ...newWebhook,
        clientId: parseInt(newWebhook.clientId),
      });
      toast.success("Webhook created successfully!");
      setShowAddDialog(false);
      setNewWebhook({ clientId: "", name: "", platform: "wordpress", endpointUrl: "", apiKey: "", authHeader: "" });
      refetchWebhooks();
    } catch {
      toast.error("Failed to create webhook");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Webhook deleted");
      refetchWebhooks();
    } catch {
      toast.error("Failed to delete webhook");
    }
  };

  const handleTestConnection = async (webhookId: number) => {
    setTestingId(webhookId);
    try {
      const result = await testMutation.mutateAsync({ webhookId });
      if (result.success) {
        toast.success(`Connection successful! (HTTP ${result.statusCode})`);
      } else {
        toast.error(`Connection failed: ${result.message}`);
      }
    } catch {
      toast.error("Connection test failed");
    } finally {
      setTestingId(null);
    }
  };

  const handlePublish = async () => {
    if (!selectedContentId || !selectedWebhookId) {
      toast.error("Please select content and a webhook");
      return;
    }
    try {
      const result = await publishMutation.mutateAsync({
        contentId: parseInt(selectedContentId),
        webhookId: parseInt(selectedWebhookId),
        publishAsDraft,
      });
      if (result.success) {
        toast.success(
          result.publishedUrl
            ? `Published successfully! URL: ${result.publishedUrl}`
            : "Content published successfully!"
        );
      } else {
        toast.error(`Publishing failed: ${result.error}${result.errorDetails ? ` - ${result.errorDetails}` : ""}`);
      }
      setShowPublishDialog(false);
      refetchLogs();
    } catch {
      toast.error("Failed to publish content");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Webhook className="h-8 w-8" />
          Publishing & Webhooks
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure CMS endpoints and publish approved content directly to client websites
        </p>
      </div>

      {/* Platform Support Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(platformConfig).map(([key, config]) => (
          <div key={key} className="p-3 rounded-lg border border-border/50 bg-card/50">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={config.color}>{config.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Webhook Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Client *</Label>
                <Select value={newWebhook.clientId} onValueChange={(v) => setNewWebhook({ ...newWebhook, clientId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsList?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  placeholder="e.g., Client Blog WordPress"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Platform *</Label>
                <Select
                  value={newWebhook.platform}
                  onValueChange={(v: any) => setNewWebhook({ ...newWebhook, platform: v, endpointUrl: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wordpress">WordPress</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                    <SelectItem value="webflow">Webflow</SelectItem>
                    <SelectItem value="custom">Custom API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Platform-specific setup guide */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-primary">{currentPlatform.label} Setup</p>
                    <p className="text-muted-foreground">URL format: <code className="text-primary/80">{currentPlatform.urlHint}</code></p>
                    <p className="text-muted-foreground">Auth: {currentPlatform.authHint}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Endpoint URL *</Label>
                <Input
                  placeholder={currentPlatform.urlHint}
                  value={newWebhook.endpointUrl}
                  onChange={(e) => setNewWebhook({ ...newWebhook, endpointUrl: e.target.value })}
                />
              </div>
              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder={newWebhook.platform === "ghost" ? "Ghost Admin API Key (id:secret)" : "Bearer token or API key"}
                  value={newWebhook.apiKey}
                  onChange={(e) => setNewWebhook({ ...newWebhook, apiKey: e.target.value })}
                />
              </div>
              <div>
                <Label>Custom Auth Header (overrides API Key)</Label>
                <Input
                  placeholder="Basic dXNlcjpwYXNz or Token xxx"
                  value={newWebhook.authHeader}
                  onChange={(e) => setNewWebhook({ ...newWebhook, authHeader: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateWebhook} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Webhook
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={!approvedContent.length || !webhooks?.length}>
              <Send className="h-4 w-4 mr-2" />
              Publish Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Publish Content to CMS</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Approved Content</Label>
                <Select value={selectedContentId} onValueChange={setSelectedContentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose content..." />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedContent.map((item) => (
                      <SelectItem key={item.content.id} value={item.content.id.toString()}>
                        {item.content.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Select Webhook Endpoint</Label>
                <Select value={selectedWebhookId} onValueChange={setSelectedWebhookId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose webhook..." />
                  </SelectTrigger>
                  <SelectContent>
                    {webhooks?.map((w) => (
                      <SelectItem key={w.id} value={w.id.toString()}>
                        {w.name} ({platformConfig[w.platform]?.label})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Publish Mode</Label>
                <Select value={publishAsDraft ? "draft" : "publish"} onValueChange={(v) => setPublishAsDraft(v === "draft")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Save as Draft</SelectItem>
                    <SelectItem value="publish">Publish Immediately</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {publishAsDraft ? "Content will be saved as a draft in the CMS for final review" : "Content will be published live immediately"}
                </p>
              </div>

              {/* Preview Payload Button */}
              {selectedContentId && selectedWebhookId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreviewDialog(true)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview API Payload
                </Button>
              )}

              <Button onClick={handlePublish} disabled={publishMutation.isPending} className="w-full">
                {publishMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {publishAsDraft ? "Publish as Draft" : "Publish Live"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payload Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>API Payload Preview</DialogTitle>
          </DialogHeader>
          {payloadPreview ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={platformConfig[payloadPreview.platform]?.color}>
                  {platformConfig[payloadPreview.platform]?.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {payloadPreview.method} {payloadPreview.url}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Headers:</p>
                <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(payloadPreview.headers, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Payload:</p>
                <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto max-h-96">
                  {JSON.stringify(payloadPreview.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="webhooks">
        <TabsList>
          <TabsTrigger value="webhooks">Webhook Configurations</TabsTrigger>
          <TabsTrigger value="history">Publish History</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configured Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              {webhooks && webhooks.length > 0 ? (
                <div className="space-y-3">
                  {webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{webhook.name}</span>
                          <Badge className={platformConfig[webhook.platform]?.color || "bg-gray-500/20"}>
                            {platformConfig[webhook.platform]?.label || webhook.platform}
                          </Badge>
                          {webhook.isActive ? (
                            <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {webhook.endpointUrl.length > 60
                            ? webhook.endpointUrl.substring(0, 60) + "..."
                            : webhook.endpointUrl}
                        </p>
                        {webhook.lastPublishedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last published: {new Date(webhook.lastPublishedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(webhook.id)}
                          disabled={testingId === webhook.id}
                        >
                          {testingId === webhook.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                          <span className="ml-1 hidden sm:inline">Test</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(webhook.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No webhooks configured yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a webhook to start publishing content to client CMS platforms
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Recent Publish Activity
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={selectedContentId} onValueChange={(v) => { setSelectedContentId(v); }}>
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="Select content to view logs..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contentList?.map((item) => (
                      <SelectItem key={item.content.id} value={item.content.id.toString()}>
                        {item.content.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedContentId && publishLogs && publishLogs.length > 0 ? (
                <div className="space-y-2">
                  {publishLogs.map((log) => {
                    const config = statusConfig[log.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    let publishedUrl = "";
                    try {
                      const body = JSON.parse(log.responseBody || "{}");
                      publishedUrl = body.publishedUrl || "";
                    } catch {}
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30"
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`h-5 w-5 ${config.color.split(" ")[1]}`} />
                          <div>
                            <Badge className={config.color}>{config.label}</Badge>
                            {log.responseCode ? (
                              <span className="text-xs text-muted-foreground ml-2">
                                HTTP {log.responseCode}
                              </span>
                            ) : null}
                            {publishedUrl && (
                              <a
                                href={publishedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary ml-2 hover:underline"
                              >
                                View Post
                              </a>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.publishedAt).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : selectedContentId ? (
                <p className="text-center text-muted-foreground py-4">
                  No publish logs for this content
                </p>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Select content above to view publish history
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
