import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ClipboardList,
  Plus,
  Link2,
  Copy,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Loader2,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const briefStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  submitted: { label: "Submitted", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  in_review: { label: "In Review", color: "bg-yellow-500/20 text-yellow-400", icon: Eye },
  accepted: { label: "Accepted", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400", icon: XCircle },
};

const toneLabels: Record<string, string> = {
  professional: "Professional",
  casual: "Casual",
  technical: "Technical",
  friendly: "Friendly",
  authoritative: "Authoritative",
  conversational: "Conversational",
};

const typeLabels: Record<string, string> = {
  "blog-post": "Blog Post",
  "how-to": "How-To Guide",
  listicle: "Listicle",
  "case-study": "Case Study",
  guide: "Guide",
  news: "News Article",
};

export default function Briefs() {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedBrief, setSelectedBrief] = useState<any>(null);

  const { data: clientsList } = trpc.clients.list.useQuery();
  const { data: briefs, refetch: refetchBriefs } = trpc.briefs.list.useQuery(
    selectedClientId ? { clientId: parseInt(selectedClientId) } : undefined
  );

  const generateLinkMutation = trpc.briefs.generateLink.useMutation();
  const updateStatusMutation = trpc.briefs.updateStatus.useMutation();
  const deleteMutation = trpc.briefs.delete.useMutation();

  const handleGenerateLink = async () => {
    if (!selectedClientId) {
      toast.error("Please select a client first");
      return;
    }
    try {
      const result = await generateLinkMutation.mutateAsync({
        clientId: parseInt(selectedClientId),
      });
      const briefUrl = `${window.location.origin}/brief/${result.shareToken}`;
      await navigator.clipboard.writeText(briefUrl);
      toast.success("Brief link generated and copied to clipboard!");
      refetchBriefs();
    } catch {
      toast.error("Failed to generate brief link");
    }
  };

  const handleUpdateStatus = async (id: number, status: "submitted" | "in_review" | "accepted" | "rejected") => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success(`Brief status updated to ${status}`);
      refetchBriefs();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Brief deleted");
      refetchBriefs();
    } catch {
      toast.error("Failed to delete brief");
    }
  };

  const copyBriefLink = (token: string) => {
    const url = `${window.location.origin}/brief/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Brief link copied to clipboard!");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <ClipboardList className="h-8 w-8" />
          Content Briefs
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate shareable intake forms for clients to submit content briefs with keywords, audience, and tone preferences
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-sm">
              <label className="block text-sm font-medium mb-2">Filter by Client</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="All clients..." />
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
            <Button onClick={handleGenerateLink} disabled={!selectedClientId || generateLinkMutation.isPending}>
              {generateLinkMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Generate Brief Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Briefs List */}
      <div className="space-y-4">
        {briefs && briefs.length > 0 ? (
          briefs.map((brief) => {
            const config = briefStatusConfig[brief.status] || briefStatusConfig.submitted;
            const StatusIcon = config.icon;
            const client = clientsList?.find((c) => c.id === brief.clientId);

            return (
              <Card key={brief.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {brief.title || "Pending Submission"}
                        </h3>
                        <Badge className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                        {client && (
                          <div>
                            <span className="text-muted-foreground">Client:</span>{" "}
                            <span className="font-medium">{client.name}</span>
                          </div>
                        )}
                        {brief.contentType && (
                          <div>
                            <span className="text-muted-foreground">Type:</span>{" "}
                            <span className="font-medium">{typeLabels[brief.contentType] || brief.contentType}</span>
                          </div>
                        )}
                        {brief.tonePreference && (
                          <div>
                            <span className="text-muted-foreground">Tone:</span>{" "}
                            <span className="font-medium">{toneLabels[brief.tonePreference] || brief.tonePreference}</span>
                          </div>
                        )}
                        {brief.wordCountTarget && (
                          <div>
                            <span className="text-muted-foreground">Words:</span>{" "}
                            <span className="font-medium">{brief.wordCountTarget}</span>
                          </div>
                        )}
                      </div>

                      {brief.targetKeywords && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Keywords:</span>{" "}
                          <span>{brief.targetKeywords}</span>
                        </div>
                      )}
                      {brief.targetAudience && (
                        <div className="mt-1 text-sm">
                          <span className="text-muted-foreground">Audience:</span>{" "}
                          <span>{brief.targetAudience}</span>
                        </div>
                      )}
                      {brief.additionalNotes && (
                        <div className="mt-1 text-sm">
                          <span className="text-muted-foreground">Notes:</span>{" "}
                          <span>{brief.additionalNotes}</span>
                        </div>
                      )}

                      {brief.submittedBy && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted by: {brief.submittedBy}
                          {brief.submittedEmail ? ` (${brief.submittedEmail})` : ""}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(brief.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyBriefLink(brief.shareToken)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Link
                      </Button>

                      {/* Status Actions */}
                      <div className="flex gap-1">
                        {brief.status !== "accepted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(brief.id, "accepted")}
                            className="text-green-400 hover:text-green-300"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {brief.status !== "in_review" && brief.status !== "accepted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(brief.id, "in_review")}
                            className="text-yellow-400 hover:text-yellow-300"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(brief.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No content briefs yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Select a client and generate a shareable brief link to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
