import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon, Palette, FileText, Save, Loader2, Plus, Trash2, Building2
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { data: settings, isLoading, refetch } = trpc.agencySettings.getAll.useQuery();
  const { data: promptTemplates, refetch: refetchTemplates } = trpc.agencySettings.getPromptTemplates.useQuery();
  const updateBatchMutation = trpc.agencySettings.updateBatch.useMutation();
  const saveTemplateMutation = trpc.agencySettings.savePromptTemplate.useMutation();
  const deleteTemplateMutation = trpc.agencySettings.deletePromptTemplate.useMutation();

  // Branding state
  const [agencyName, setAgencyName] = useState("");
  const [agencyTagline, setAgencyTagline] = useState("");
  const [agencyLogoUrl, setAgencyLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [defaultTone, setDefaultTone] = useState("");
  const [defaultAudience, setDefaultAudience] = useState("");
  const [footerText, setFooterText] = useState("");

  // New template dialog
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplatePrompt, setNewTemplatePrompt] = useState("");

  useEffect(() => {
    if (settings) {
      setAgencyName(settings["agency_name"] || "");
      setAgencyTagline(settings["agency_tagline"] || "");
      setAgencyLogoUrl(settings["agency_logo_url"] || "");
      setPrimaryColor(settings["primary_color"] || "#3b82f6");
      setDefaultTone(settings["default_tone"] || "");
      setDefaultAudience(settings["default_audience"] || "");
      setFooterText(settings["footer_text"] || "");
    }
  }, [settings]);

  const handleSaveBranding = async () => {
    try {
      await updateBatchMutation.mutateAsync({
        settings: {
          agency_name: agencyName,
          agency_tagline: agencyTagline,
          agency_logo_url: agencyLogoUrl,
          primary_color: primaryColor,
          default_tone: defaultTone,
          default_audience: defaultAudience,
          footer_text: footerText,
        },
      });
      toast.success("Branding settings saved");
      refetch();
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplatePrompt.trim()) {
      toast.error("Please fill in template name and prompt");
      return;
    }
    try {
      await saveTemplateMutation.mutateAsync({
        name: newTemplateName,
        prompt: newTemplatePrompt,
      });
      toast.success("Template saved");
      setShowNewTemplate(false);
      setNewTemplateName("");
      setNewTemplatePrompt("");
      refetchTemplates();
    } catch {
      toast.error("Failed to save template");
    }
  };

  const handleDeleteTemplate = async (key: string) => {
    try {
      await deleteTemplateMutation.mutateAsync({ key });
      toast.success("Template deleted");
      refetchTemplates();
    } catch {
      toast.error("Failed to delete template");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your agency branding, default prompts, and platform settings
        </p>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Prompt Templates
          </TabsTrigger>
          <TabsTrigger value="defaults" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Content Defaults
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agency Identity</CardTitle>
                <CardDescription>Set your agency name, tagline, and logo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input
                    id="agencyName"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Your Agency Name"
                  />
                </div>
                <div>
                  <Label htmlFor="agencyTagline">Tagline</Label>
                  <Input
                    id="agencyTagline"
                    value={agencyTagline}
                    onChange={(e) => setAgencyTagline(e.target.value)}
                    placeholder="Your agency tagline or motto"
                  />
                </div>
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={agencyLogoUrl}
                    onChange={(e) => setAgencyLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  {agencyLogoUrl && (
                    <div className="mt-3 p-4 bg-muted/30 rounded-lg flex items-center justify-center">
                      <img
                        src={agencyLogoUrl}
                        alt="Agency Logo"
                        className="max-h-20 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize colors and footer text</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Brand Color</Label>
                  <div className="flex gap-3 items-center mt-1">
                    <input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-16 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <Separator />
                <div>
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Textarea
                    id="footerText"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Text to appear in exported content footers"
                    rows={3}
                  />
                </div>
                <div className="mt-4 p-4 rounded-lg border border-border/50 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div>
                      <p className="font-semibold text-sm">{agencyName || "Your Agency"}</p>
                      <p className="text-xs text-muted-foreground">{agencyTagline || "Your tagline"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <Button onClick={handleSaveBranding} disabled={updateBatchMutation.isPending}>
                {updateBatchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Branding Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Prompt Templates Tab */}
        <TabsContent value="prompts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Default Prompt Templates</CardTitle>
                <CardDescription>Create reusable AI prompts for content generation</CardDescription>
              </div>
              <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Prompt Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Template Name</Label>
                      <Input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="e.g. SEO Blog Post, Product Description"
                      />
                    </div>
                    <div>
                      <Label>Prompt</Label>
                      <Textarea
                        value={newTemplatePrompt}
                        onChange={(e) => setNewTemplatePrompt(e.target.value)}
                        placeholder="You are an expert SEO content writer. Your task is to write a comprehensive blog post about {topic}..."
                        rows={10}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {"{topic}"}, {"{keywords}"}, {"{audience}"}, {"{tone}"} as placeholders
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewTemplate(false)}>Cancel</Button>
                    <Button onClick={handleSaveTemplate} disabled={saveTemplateMutation.isPending}>
                      {saveTemplateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {!promptTemplates || promptTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Prompt Templates</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create default prompts to use when generating content for clients
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {promptTemplates.map((template) => (
                    <div key={template.id} className="p-4 rounded-lg border border-border/50 bg-card/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">{template.name}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono line-clamp-3">
                        {template.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Defaults Tab */}
        <TabsContent value="defaults">
          <Card>
            <CardHeader>
              <CardTitle>Content Generation Defaults</CardTitle>
              <CardDescription>Set default values for new content generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div>
                <Label htmlFor="defaultTone">Default Tone</Label>
                <Input
                  id="defaultTone"
                  value={defaultTone}
                  onChange={(e) => setDefaultTone(e.target.value)}
                  placeholder="e.g. Professional, Friendly, Authoritative"
                />
              </div>
              <div>
                <Label htmlFor="defaultAudience">Default Target Audience</Label>
                <Input
                  id="defaultAudience"
                  value={defaultAudience}
                  onChange={(e) => setDefaultAudience(e.target.value)}
                  placeholder="e.g. Small business owners, Marketing professionals"
                />
              </div>
              <Separator />
              <Button onClick={handleSaveBranding} disabled={updateBatchMutation.isPending}>
                {updateBatchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Defaults
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
