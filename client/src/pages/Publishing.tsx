import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const platformConfig: Record<string, { label: string; color: string }> = {
  wordpress: { label: "WordPress", color: "bg-blue-500/20 text-blue-400" },
  ghost: { label: "Ghost", color: "bg-purple-500/20 text-purple-400" },
  webflow: { label: "Webflow", color: "bg-indigo-500/20 text-indigo-400" },
  custom: { label: "Custom API", color: "bg-gray-500/20 text-gray-400" },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  success: { label: "Published", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400", icon: XCircle },
};

export default function Publishing() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [selectedWebhookId, setSelectedWebhookId] = useState<string>("");
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
    { enabled: !!selectedContentId }
  );

  const createMutation = trpc.webhooks.create.useMutation();
  const deleteMutation = trpc.webhooks.delete.useMutation();
  const publishMutation = trpc.webhooks.publish.useMutation();

  const approvedContent = useMemo(
    () => contentList?.filter((c) => c.content.status === "approved") || [],
    [contentList]
  );

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

  const handlePublish = async () => {
    if (!selectedContentId || !selectedWebhookId) {
      toast.error("Please select content and a webhook");
      return;
    }
    try {
      const result = await publishMutation.mutateAsync({
        contentId: parseInt(selectedContentId),
        webhookId: parseInt(selectedWebhookId),
      });
      if (result.success) {
        toast.success("Content published successfully!");
      } else {
        toast.error(`Publishing failed: ${result.error}`);
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

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Webhook Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Client</Label>
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
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Client Blog WordPress"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Platform</Label>
                <Select
                  value={newWebhook.platform}
                  onValueChange={(v: any) => setNewWebhook({ ...newWebhook, platform: v })}
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
              <div>
                <Label>Endpoint URL</Label>
                <Input
                  placeholder="https://yoursite.com/wp-json/wp/v2/posts"
                  value={newWebhook.endpointUrl}
                  onChange={(e) => setNewWebhook({ ...newWebhook, endpointUrl: e.target.value })}
                />
              </div>
              <div>
                <Label>API Key (optional)</Label>
                <Input
                  type="password"
                  placeholder="Bearer token or API key"
                  value={newWebhook.apiKey}
                  onChange={(e) => setNewWebhook({ ...newWebhook, apiKey: e.target.value })}
                />
              </div>
              <div>
                <Label>Custom Auth Header (optional)</Label>
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
          <DialogContent>
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
              <Button onClick={handlePublish} disabled={publishMutation.isPending} className="w-full">
                {publishMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Publish Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhook Configurations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Webhook Configurations
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
                  <div className="flex items-center gap-4">
                    <div>
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
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(webhook.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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

      {/* Publish History */}
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
    </div>
  );
}
