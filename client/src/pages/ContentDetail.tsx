import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Save, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRoute, Link } from "wouter";
import { Streamdown } from "streamdown";

export default function ContentDetail() {
  const [, params] = useRoute("/content/:id");
  const contentId = params?.id ? parseInt(params.id) : 0;

  const { data: content, isLoading, refetch } = trpc.content.getById.useQuery(
    { id: contentId },
    { enabled: contentId > 0 }
  );
  const updateMutation = trpc.content.update.useMutation();

  const [title, setTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [status, setStatus] = useState<"draft" | "in_progress" | "approved">("draft");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (content) {
      setTitle(content.title);
      setContentText(content.content);
      setStatus(content.status);
      setProgress(content.progress);
    }
  }, [content]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: contentId,
        title,
        content: contentText,
        status,
        progress,
      });
      toast.success("Content saved successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to save content");
    }
  };

  const handleExport = () => {
    const blob = new Blob([`# ${title}\n\n${contentText}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Content exported");
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Content not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/content">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {content.imageUrl && (
                <img
                  src={content.imageUrl}
                  alt={title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              <div className="prose prose-sm max-w-none">
                <Streamdown>{contentText}</Streamdown>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="progress">Progress: {progress}%</Label>
                <Progress value={progress} className="mt-2" />
                <Input
                  id="progress"
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Model Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="text-sm font-medium">{content.aiModel}</p>
              </div>
              {content.customPrompt && (
                <div>
                  <p className="text-sm text-muted-foreground">Custom Prompt</p>
                  <p className="text-sm font-medium line-clamp-3">
                    {content.customPrompt}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Input:</span>
                <span className="font-medium">{content.inputTokens}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Output:</span>
                <span className="font-medium">{content.outputTokens}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold">{content.totalTokens}</span>
              </div>
            </CardContent>
          </Card>

          {content.webSearches > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Research Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">URLs Fetched:</span>
                  <span className="font-medium">{content.urlsFetched}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">URLs Failed:</span>
                  <span className="font-medium text-red-600">{content.urlsFailed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Web Searches:</span>
                  <span className="font-medium">{content.webSearches}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
