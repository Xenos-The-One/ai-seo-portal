import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Notifications() {
  const [customTitle, setCustomTitle] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [selectedContentId, setSelectedContentId] = useState<string>("");

  const { data: contentList } = trpc.content.list.useQuery();
  const sendCustom = trpc.notifications.sendCustom.useMutation();
  const contentReady = trpc.notifications.contentReadyForReview.useMutation();
  const contentApproved = trpc.notifications.contentApproved.useMutation();
  const contentGenerated = trpc.notifications.contentGenerated.useMutation();
  const contentPublished = trpc.notifications.contentPublished.useMutation();

  const handleSendCustom = async () => {
    if (!customTitle.trim() || !customContent.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }
    try {
      const result = await sendCustom.mutateAsync({ title: customTitle, content: customContent });
      if (result.sent) {
        toast.success("Notification sent successfully!");
        setCustomTitle("");
        setCustomContent("");
      } else {
        toast.error("Failed to send notification");
      }
    } catch {
      toast.error("Failed to send notification");
    }
  };

  const handleQuickNotify = async (type: string) => {
    if (!selectedContentId) {
      toast.error("Please select a content item first");
      return;
    }
    const id = parseInt(selectedContentId);
    try {
      let result;
      switch (type) {
        case "ready":
          result = await contentReady.mutateAsync({ contentId: id });
          break;
        case "approved":
          result = await contentApproved.mutateAsync({ contentId: id });
          break;
        case "generated":
          result = await contentGenerated.mutateAsync({ contentId: id });
          break;
        case "published":
          result = await contentPublished.mutateAsync({ contentId: id });
          break;
      }
      if (result?.sent) {
        toast.success("Notification sent!");
      } else {
        toast.error("Failed to send notification");
      }
    } catch {
      toast.error("Failed to send notification");
    }
  };

  const isAnyLoading = sendCustom.isPending || contentReady.isPending || contentApproved.isPending || contentGenerated.isPending || contentPublished.isPending;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Send notifications for content events and custom alerts
        </p>
      </div>

      {/* Quick Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Quick Content Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Content</Label>
            <Select value={selectedContentId} onValueChange={setSelectedContentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a content item..." />
              </SelectTrigger>
              <SelectContent>
                {contentList?.map((item) => (
                  <SelectItem key={item.content.id} value={String(item.content.id)}>
                    {item.content.title} ({item.client?.name || "Unknown"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleQuickNotify("generated")}
              disabled={isAnyLoading || !selectedContentId}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Content Generated</p>
                  <p className="text-xs text-muted-foreground">AI content has been created</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleQuickNotify("ready")}
              disabled={isAnyLoading || !selectedContentId}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Ready for Review</p>
                  <p className="text-xs text-muted-foreground">Content needs client review</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleQuickNotify("approved")}
              disabled={isAnyLoading || !selectedContentId}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Content Approved</p>
                  <p className="text-xs text-muted-foreground">Content has been approved</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleQuickNotify("published")}
              disabled={isAnyLoading || !selectedContentId}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Send className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Content Published</p>
                  <p className="text-xs text-muted-foreground">Content has been published</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Custom Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notif-title">Title</Label>
            <Input
              id="notif-title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Notification title..."
            />
          </div>
          <div>
            <Label htmlFor="notif-content">Content</Label>
            <Textarea
              id="notif-content"
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="Write your notification message..."
              rows={4}
            />
          </div>
          <Button onClick={handleSendCustom} disabled={sendCustom.isPending}>
            {sendCustom.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Notification
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">About Notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                Notifications are sent to the project owner through the Manus notification system.
                You can configure additional notification channels in the Settings panel of the Management UI.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
