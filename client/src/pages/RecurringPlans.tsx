import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Calendar, Trash2, Play, Pause, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Recurring content plans - automate content generation on a schedule
 * Allows setting up recurring plans like "2 blog posts per week for Client X"
 */
export default function RecurringPlans() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: 0,
    planName: "",
    frequency: "weekly" as "daily" | "weekly" | "biweekly" | "monthly",
    postsPerCycle: 1,
    topicTemplate: "",
    customPrompt: "",
    aiModel: "gemini-2.5-flash",
    enableWebResearch: true,
    enableImageGeneration: true,
  });

  const { data: clients } = trpc.clients.list.useQuery();
  const { data: plans, refetch } = trpc.recurringPlans.list.useQuery();
  const { data: settings } = trpc.agencySettings.getAll.useQuery();

  // Update default AI model when settings load
  useEffect(() => {
    if (settings?.default_ai_model && formData.aiModel === "gemini-2.5-flash") {
      setFormData(prev => ({ ...prev, aiModel: settings.default_ai_model }));
    }
  }, [settings]);

  const createMutation = trpc.recurringPlans.create.useMutation({
    onSuccess: () => {
      toast.success("Recurring plan created");
      setIsDialogOpen(false);
      refetch();
      setFormData({
        clientId: 0,
        planName: "",
        frequency: "weekly",
        postsPerCycle: 1,
        topicTemplate: "",
        customPrompt: "",
        aiModel: "gemini-2.5-flash",
        enableWebResearch: true,
        enableImageGeneration: true,
      });
    },
    onError: (error) => {
      toast.error(`Failed to create plan: ${error.message}`);
    },
  });

  const toggleMutation = trpc.recurringPlans.toggle.useMutation({
    onSuccess: () => {
      toast.success("Plan status updated");
      refetch();
    },
  });

  const deleteMutation = trpc.recurringPlans.delete.useMutation({
    onSuccess: () => {
      toast.success("Plan deleted");
      refetch();
    },
  });

  const runNowMutation = trpc.recurringPlans.runNow.useMutation({
    onSuccess: () => {
      toast.success("Content generation started");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to run plan: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.planName) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      biweekly: "Every 2 weeks",
      monthly: "Monthly",
    };
    return labels[freq] || freq;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Recurring Content Plans</h1>
          <p className="text-muted-foreground">
            Automate content generation with recurring schedules
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Recurring Content Plan</DialogTitle>
              <DialogDescription>
                Set up automated content generation on a schedule
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name *</Label>
                <Input
                  id="planName"
                  value={formData.planName}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  placeholder="e.g., Weekly Blog Posts for Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.clientId.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clientId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postsPerCycle">Posts Per Cycle</Label>
                  <Input
                    id="postsPerCycle"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.postsPerCycle}
                    onChange={(e) =>
                      setFormData({ ...formData, postsPerCycle: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topicTemplate">Topic Template</Label>
                <Textarea
                  id="topicTemplate"
                  value={formData.topicTemplate}
                  onChange={(e) => setFormData({ ...formData, topicTemplate: e.target.value })}
                  placeholder="e.g., Latest trends in {industry}, How to improve {topic}"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Use placeholders like {"{industry}"} or {"{topic}"} for dynamic topics
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customPrompt">Custom Prompt (Optional)</Label>
                <Textarea
                  id="customPrompt"
                  value={formData.customPrompt}
                  onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })}
                  placeholder="Custom instructions for AI content generation"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiModel">AI Model</Label>
                <Select
                  value={formData.aiModel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, aiModel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (High Quality)</SelectItem>
                    <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Balanced)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Cost-Effective)</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Claude models excel at creative writing, GPT models are versatile, Gemini models are cost-effective
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="webResearch">Enable Web Research</Label>
                  <p className="text-xs text-muted-foreground">
                    Fetch current data from the web
                  </p>
                </div>
                <Switch
                  id="webResearch"
                  checked={formData.enableWebResearch}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableWebResearch: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="imageGen">Enable Image Generation</Label>
                  <p className="text-xs text-muted-foreground">
                    Generate featured images with AI
                  </p>
                </div>
                <Switch
                  id="imageGen"
                  checked={formData.enableImageGeneration}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableImageGeneration: checked })
                  }
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Plan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!plans || plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recurring plans yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create a plan to automate content generation
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {plans.map((plan: any) => {
            const client = clients?.find((c) => c.id === plan.clientId);
            return (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        {plan.planName}
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Active" : "Paused"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {client?.name} • {getFrequencyLabel(plan.frequency)} •{" "}
                        {plan.postsPerCycle} post{plan.postsPerCycle > 1 ? "s" : ""} per cycle
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {plan.topicTemplate && (
                      <div>
                        <p className="text-sm font-medium mb-1">Topic Template</p>
                        <p className="text-sm text-muted-foreground">{plan.topicTemplate}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {plan.enableWebResearch && <Badge variant="outline">Web Research</Badge>}
                      {plan.enableImageGeneration && (
                        <Badge variant="outline">Image Generation</Badge>
                      )}
                    </div>

                    {plan.lastRunDate && (
                      <p className="text-sm text-muted-foreground">
                        Last run: {new Date(plan.lastRunDate).toLocaleString()}
                      </p>
                    )}
                    {plan.nextRunDate && (
                      <p className="text-sm text-muted-foreground">
                        Next run: {new Date(plan.nextRunDate).toLocaleString()}
                      </p>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runNowMutation.mutate({ id: plan.id })}
                        disabled={runNowMutation.isPending}
                      >
                        {runNowMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Run Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMutation.mutate({ id: plan.id })}
                      >
                        {plan.isActive ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Resume
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate({ id: plan.id })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
