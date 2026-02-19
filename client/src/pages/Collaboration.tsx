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
import { MessageSquare, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Collaboration() {
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [newComment, setNewComment] = useState("");
  const [expandedContent, setExpandedContent] = useState<number | null>(null);

  const { data: contentList } = trpc.content.list.useQuery();
  const { data: comments } = trpc.collaboration.getComments.useQuery(
    { contentId: parseInt(selectedContentId) },
    { enabled: !!selectedContentId }
  );

  const addCommentMutation = trpc.collaboration.addComment.useMutation();
  const resolveCommentMutation = trpc.collaboration.resolveComment.useMutation();

  const handleAddComment = async () => {
    if (!selectedContentId || !newComment.trim()) {
      toast.error("Please select content and enter a comment");
      return;
    }

    try {
      await addCommentMutation.mutateAsync({
        contentId: parseInt(selectedContentId),
        comment: newComment,
      });
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleResolveComment = async (commentId: number) => {
    try {
      await resolveCommentMutation.mutateAsync({ commentId });
      toast.success("Comment resolved");
    } catch (error) {
      toast.error("Failed to resolve comment");
    }
  };

  const selectedContent = contentList?.find(
    (c) => c.content.id === parseInt(selectedContentId)
  );

  const pendingComments = comments?.filter((c: any) => c.status === "pending") || [];
  const resolvedComments = comments?.filter((c: any) => c.status === "resolved") || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Team Collaboration</h1>
        <p className="text-muted-foreground mt-2">
          Collaborate with your team on content through comments and feedback
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="content-select">Choose content to review</Label>
                <Select value={selectedContentId} onValueChange={setSelectedContentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content..." />
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

              {selectedContent && (
                <div className="mt-6 p-4 bg-accent rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedContent.content.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedContent.content.topic}
                  </p>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-primary text-primary-foreground rounded">
                      {selectedContent.content.status}
                    </span>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded">
                      {selectedContent.content.progress}% complete
                    </span>
                  </div>
                </div>
              )}

              {/* Add Comment */}
              {selectedContentId && (
                <div className="mt-6 p-4 border border-border rounded-lg">
                  <Label htmlFor="comment" className="mb-2 block">
                    Add Feedback
                  </Label>
                  <Textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your feedback, suggestions, or requests for revision..."
                    rows={4}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={addCommentMutation.isPending}
                    className="mt-3"
                  >
                    {addCommentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Comment
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comments List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedContentId ? (
                <p className="text-sm text-muted-foreground">
                  Select content to view feedback
                </p>
              ) : comments?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No feedback yet</p>
              ) : (
                <div className="space-y-3">
                  {/* Pending Comments */}
                  {pendingComments.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        PENDING ({pendingComments.length})
                      </p>
                      {pendingComments.map((comment: any) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded-lg border border-border bg-card mb-2"
                        >
                          <p className="text-sm mb-2">{comment.comment}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Pending</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveComment(comment.id)}
                              disabled={resolveCommentMutation.isPending}
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Resolved Comments */}
                  {resolvedComments.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        RESOLVED ({resolvedComments.length})
                      </p>
                      {resolvedComments.map((comment: any) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded-lg border border-border bg-card mb-2 opacity-60"
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm line-through">{comment.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
