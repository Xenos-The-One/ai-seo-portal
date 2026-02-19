import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, FileText, Loader2, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Content() {
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [formData, setFormData] = useState({
    clientId: "",
    topic: "",
    customPrompt: "",
    shouldGenerateImage: true,
    enableWebResearch: true,
  });

  const { data: contentList, isLoading, refetch } = trpc.content.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const generateMutation = trpc.content.generate.useMutation();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.topic) {
      toast.error("Please select a client and enter a topic");
      return;
    }

    try {
      toast.info("Generating content... This may take a moment");
      await generateMutation.mutateAsync({
        clientId: parseInt(formData.clientId),
        topic: formData.topic,
        customPrompt: formData.customPrompt || undefined,
        shouldGenerateImage: formData.shouldGenerateImage,
        enableWebResearch: formData.enableWebResearch,
      });
      toast.success("Content generated successfully!");
      setIsGenerateOpen(false);
      setFormData({
        clientId: "",
        topic: "",
        customPrompt: "",
        shouldGenerateImage: true,
        enableWebResearch: true,
      });
      refetch();
    } catch (error) {
      toast.error("Failed to generate content");
    }
  };

  const filteredContent = contentList?.filter((item) => {
    if (filterStatus !== "all" && item.content.status !== filterStatus) return false;
    if (filterClient !== "all" && item.content.clientId.toString() !== filterClient) return false;
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content</h1>
          <p className="text-muted-foreground mt-2">
            AI-generated blog posts and articles
          </p>
        </div>
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate New Content</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clientId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                  placeholder="e.g., The Future of AI in Marketing"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customPrompt">Custom Prompt (Optional)</Label>
                <Textarea
                  id="customPrompt"
                  value={formData.customPrompt}
                  onChange={(e) =>
                    setFormData({ ...formData, customPrompt: e.target.value })
                  }
                  placeholder="Add specific instructions for the AI..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generateImage"
                  checked={formData.shouldGenerateImage}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, shouldGenerateImage: checked as boolean })
                  }
                />
                <Label htmlFor="generateImage" className="cursor-pointer">
                  Generate featured image
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="webResearch"
                  checked={formData.enableWebResearch}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableWebResearch: checked as boolean })
                  }
                />
                <Label htmlFor="webResearch" className="cursor-pointer">
                  Enable web research for accurate data
                </Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsGenerateOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading content...</p>
        </div>
      ) : filteredContent && filteredContent.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredContent.map((item) => (
            <Link key={item.content.id} href={`/content/${item.content.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {item.content.imageUrl ? (
                      <img
                        src={item.content.imageUrl}
                        alt={item.content.title}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-32 bg-muted rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold truncate">
                          {item.content.title}
                        </h3>
                        <span
                          className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ml-4 ${
                            item.content.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : item.content.status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.content.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Client: {item.client?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.content.topic}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>Tokens: {item.content.totalTokens}</span>
                        {item.content.webSearches > 0 && (
                          <span>Research: {item.content.urlsFetched} URLs</span>
                        )}
                        <span>Progress: {item.content.progress}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first AI-powered blog post
            </p>
            <Button onClick={() => setIsGenerateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Content
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
