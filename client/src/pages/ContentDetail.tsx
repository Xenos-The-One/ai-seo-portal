import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Save, Download, Loader2, Eye, Pencil, FileText, FileType, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  const handleExportMarkdown = () => {
    const blob = new Blob([`# ${title}\n\n${contentText}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizedTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown");
  };

  const handleExportHtml = () => {
    // Convert markdown to basic HTML
    const htmlContent = contentText
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Georgia', serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #333; }
    h1 { font-size: 2em; margin-bottom: 0.5em; color: #1a1a1a; }
    h2 { font-size: 1.5em; margin-top: 1.5em; color: #2a2a2a; }
    h3 { font-size: 1.2em; margin-top: 1.2em; color: #3a3a3a; }
    p { margin-bottom: 1em; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
    strong { font-weight: 700; }
    li { margin-bottom: 0.5em; }
  </style>
</head>
<body>
  ${content?.imageUrl ? `<img src="${content.imageUrl}" alt="${title}" />` : ''}
  <h1>${title}</h1>
  <p>${htmlContent}</p>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizedTitle}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as HTML (open in browser and print to PDF)");
  };

  const handleExportDocx = () => {
    // Generate a simple .doc file (Word-compatible HTML)
    const htmlContent = contentText
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    const docContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.6;} h1{font-size:20pt;} h2{font-size:16pt;} h3{font-size:13pt;}</style>
</head><body>
<h1>${title}</h1>
<p>${htmlContent}</p>
</body></html>`;

    const blob = new Blob([docContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizedTitle}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Word document");
  };

  const handleExportPlainText = () => {
    const plainText = contentText
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/---/g, '');
    const blob = new Blob([`${title}\n${'='.repeat(title.length)}\n\n${plainText}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizedTitle}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as plain text");
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
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </TabsTrigger>
            </TabsList>

            {/* Preview Tab (shown first / default) */}
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Generated Content
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      AI-generated content ready for review
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {content.imageUrl && (
                    <img
                      src={content.imageUrl}
                      alt={title}
                      className="w-full h-72 object-cover rounded-lg mb-6"
                    />
                  )}
                  <h1 className="text-2xl font-bold mb-4">{title}</h1>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{contentText}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Edit Tab */}
            <TabsContent value="edit">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pencil className="h-5 w-5" />
                    Edit Content
                  </CardTitle>
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
                    <RegenerateButton contentId={contentId} onSuccess={refetch} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleExportDocx}>
                          <FileType className="h-4 w-4 mr-2" />
                          Word Document (.doc)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportHtml}>
                          <FileText className="h-4 w-4 mr-2" />
                          HTML (Print to PDF)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportMarkdown}>
                          <FileText className="h-4 w-4 mr-2" />
                          Markdown (.md)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportPlainText}>
                          <FileText className="h-4 w-4 mr-2" />
                          Plain Text (.txt)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
                <p className="text-sm font-medium">
                  {content.aiModel === "claude-3-5-sonnet-20241022" && "Claude 3.5 Sonnet"}
                  {content.aiModel === "claude-3-5-haiku-20241022" && "Claude 3.5 Haiku"}
                  {content.aiModel === "gpt-4o" && "GPT-4o"}
                  {content.aiModel === "gpt-4o-mini" && "GPT-4o Mini"}
                  {content.aiModel === "gemini-2.5-flash" && "Gemini 2.5 Flash"}
                  {content.aiModel === "gemini-2.5-pro" && "Gemini 2.5 Pro"}
                  {![
                    "claude-3-5-sonnet-20241022",
                    "claude-3-5-haiku-20241022",
                    "gpt-4o",
                    "gpt-4o-mini",
                    "gemini-2.5-flash",
                    "gemini-2.5-pro",
                  ].includes(content.aiModel) && content.aiModel}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{content.aiModel}</p>
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

// Regenerate Button Component
function RegenerateButton({ contentId, onSuccess }: { contentId: number; onSuccess: () => void }) {
  const [showDialog, setShowDialog] = useState(false);
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [enableWebResearch, setEnableWebResearch] = useState(false);
  const [shouldGenerateImage, setShouldGenerateImage] = useState(false);
  
  const regenerateMutation = trpc.content.regenerate.useMutation();

  const handleRegenerate = async () => {
    try {
      await regenerateMutation.mutateAsync({
        id: contentId,
        aiModel,
        enableWebResearch,
        shouldGenerateImage,
      });
      toast.success("Content regenerated successfully!");
      setShowDialog(false);
      onSuccess();
    } catch {
      toast.error("Failed to regenerate content");
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Regenerate
      </Button>
      
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Regenerate Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="regenerate-model">AI Model</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger id="regenerate-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (High Quality)</SelectItem>
                    <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Balanced)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (High Quality)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Cost-Effective)</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="regenerate-research"
                  checked={enableWebResearch}
                  onChange={(e) => setEnableWebResearch(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="regenerate-research" className="cursor-pointer">
                  Enable web research
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="regenerate-image"
                  checked={shouldGenerateImage}
                  onChange={(e) => setShouldGenerateImage(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="regenerate-image" className="cursor-pointer">
                  Generate new image
                </Label>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-400">
                  Warning: This will replace the current content. Make sure to save any changes first.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRegenerate} disabled={regenerateMutation.isPending}>
                  {regenerateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
