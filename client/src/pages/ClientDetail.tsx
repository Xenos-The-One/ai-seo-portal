import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Building2,
  Globe,
  Lock,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Save,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  DollarSign,
  AlertCircle,
  UserPlus,
  Copy,
  Trash2,
  Palette,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";

export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const clientId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: client, isLoading, refetch } = trpc.clients.getById.useQuery(
    { id: clientId },
    { enabled: clientId > 0 }
  );
  const { data: contentList } = trpc.content.list.useQuery();
  const updateMutation = trpc.clients.update.useMutation();

  const clientContent = contentList?.filter((c) => c.content.clientId === clientId) || [];

  useEffect(() => {
    if (client) {
      setFormData({ ...client });
    }
  }, [client]);

  const handleSave = async () => {
    try {
      const { id, createdBy, createdAt, updatedAt, ...updates } = formData;
      await updateMutation.mutateAsync({ id: clientId, ...updates });
      toast.success("Client updated successfully!");
      setIsEditing(false);
      refetch();
    } catch {
      toast.error("Failed to update client");
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => setLocation("/clients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Client not found</p>
        </div>
      </div>
    );
  }

  const renderField = (label: string, field: string, icon?: any, type = "text", placeholder = "") => {
    const Icon = icon;
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm text-muted-foreground">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </Label>
        {isEditing ? (
          <Input
            type={type}
            value={formData[field] || ""}
            onChange={(e) => updateField(field, e.target.value)}
            placeholder={placeholder}
            className="bg-muted/30"
          />
        ) : (
          <p className="text-sm font-medium min-h-[20px]">
            {(() => {
              const val = client[field as keyof typeof client];
              if (val instanceof Date) return val.toLocaleDateString();
              return val || <span className="text-muted-foreground/50 italic">Not set</span>;
            })()}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => { setIsEditing(false); setFormData({ ...client }); }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Client</Button>
          )}
        </div>
      </div>

      {/* Client Name Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {client.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {client.company && (
                <Badge variant="outline" className="text-muted-foreground">
                  <Building2 className="h-3 w-3 mr-1" />
                  {client.company}
                </Badge>
              )}
              {client.industry && (
                <Badge variant="outline" className="text-muted-foreground">
                  {client.industry}
                </Badge>
              )}
              <Badge className="bg-green-500/20 text-green-400">
                {clientContent.length} Content Items
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="contact" className="space-y-6">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="contact" className="gap-2">
            <User className="h-4 w-4" />
            Contact Info
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="h-4 w-4" />
            Business Info
          </TabsTrigger>
          <TabsTrigger value="website" className="gap-2">
            <Lock className="h-4 w-4" />
            Website Login
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Globe className="h-4 w-4" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="portal" className="gap-2">
            <Lock className="h-4 w-4" />
            Portal Access
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
        </TabsList>

        {/* Contact Information Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField("Full Name", "name", User, "text", "John Doe")}
                {renderField("Email Address", "email", Mail, "email", "john@example.com")}
                {renderField("Phone Number", "phone", Phone, "tel", "+1 (555) 123-4567")}
                {renderField("Company", "company", Building2, "text", "Acme Corp")}
              </div>
              <Separator className="my-6" />
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Mailing Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField("Street Address", "address", MapPin, "text", "123 Main St")}
                {renderField("City", "city", undefined, "text", "New York")}
                {renderField("State / Province", "state", undefined, "text", "NY")}
                {renderField("ZIP / Postal Code", "zipCode", undefined, "text", "10001")}
                {renderField("Country", "country", undefined, "text", "United States")}
              </div>
              <Separator className="my-6" />
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Notes</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.notes || ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Additional notes about this client..."
                    rows={4}
                    className="bg-muted/30"
                  />
                ) : (
                  <p className="text-sm min-h-[20px]">
                    {client.notes || (
                      <span className="text-muted-foreground/50 italic">No notes</span>
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Information Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField("Business Name", "businessName", Building2, "text", "Acme Corporation")}
                {renderField("Business Type", "businessType", undefined, "text", "LLC, Corp, Sole Proprietor")}
                {renderField("Industry", "industry", undefined, "text", "Technology, Healthcare, etc.")}
                {renderField("Business Phone", "businessPhone", Phone, "tel", "+1 (555) 987-6543")}
                {renderField("Business Email", "businessEmail", Mail, "email", "info@acmecorp.com")}
                {renderField("Business Website", "businessWebsite", Globe, "url", "https://www.acmecorp.com")}
              </div>
              <Separator className="my-6" />
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Business Address</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.businessAddress || ""}
                    onChange={(e) => updateField("businessAddress", e.target.value)}
                    placeholder="Full business address..."
                    rows={3}
                    className="bg-muted/30"
                  />
                ) : (
                  <p className="text-sm min-h-[20px]">
                    {client.businessAddress || (
                      <span className="text-muted-foreground/50 italic">Not set</span>
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Website Login Tab */}
        <TabsContent value="website">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Website Login Credentials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-400">
                  <strong>Security Notice:</strong> These credentials are stored for your team's convenience. Ensure only authorized team members have access to this information.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField("Website URL", "websiteUrl", Globe, "url", "https://clientsite.com")}
                {renderField("CMS Platform", "websitePlatform", undefined, "text", "WordPress, Shopify, Wix, etc.")}
                {renderField("Login Page URL", "websiteLoginUrl", ExternalLink, "url", "https://clientsite.com/wp-admin")}
                {renderField("Username", "websiteUsername", User, "text", "admin")}

                {/* Password field with show/hide toggle */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" />
                    Password
                  </Label>
                  {isEditing ? (
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.websitePassword || ""}
                        onChange={(e) => updateField("websitePassword", e.target.value)}
                        placeholder="••••••••"
                        className="bg-muted/30 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium font-mono">
                        {client.websitePassword ? (
                          showPassword ? client.websitePassword : "••••••••••••"
                        ) : (
                          <span className="text-muted-foreground/50 italic font-sans">Not set</span>
                        )}
                      </p>
                      {client.websitePassword && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-6 px-2"
                        >
                          {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-6" />
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Website Notes</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.websiteNotes || ""}
                    onChange={(e) => updateField("websiteNotes", e.target.value)}
                    placeholder="Hosting provider, FTP details, special instructions..."
                    rows={4}
                    className="bg-muted/30"
                  />
                ) : (
                  <p className="text-sm min-h-[20px]">
                    {client.websiteNotes || (
                      <span className="text-muted-foreground/50 italic">No notes</span>
                    )}
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              {client.websiteLoginUrl && !isEditing && (
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => window.open(client.websiteLoginUrl!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Login Page
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField("Facebook", "socialFacebook", Facebook, "url", "https://facebook.com/clientpage")}
                {renderField("Instagram", "socialInstagram", Instagram, "url", "https://instagram.com/clienthandle")}
                {renderField("LinkedIn", "socialLinkedin", Linkedin, "url", "https://linkedin.com/company/client")}
                {renderField("Twitter / X", "socialTwitter", Twitter, "url", "https://twitter.com/clienthandle")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content for {client.name}
                <Badge className="ml-2">{clientContent.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientContent.length > 0 ? (
                <div className="space-y-3">
                  {clientContent.map((item) => (
                    <div
                      key={item.content.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => setLocation(`/content/${item.content.id}`)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.content.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Topic: {item.content.topic}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(item.content.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={
                          item.content.status === "approved"
                            ? "bg-green-500/20 text-green-400"
                            : item.content.status === "in_progress"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                        }
                      >
                        {item.content.status === "in_progress" ? "In Progress" : item.content.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No content generated for this client yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setLocation("/content")}
                  >
                    Generate Content
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget">
          <BudgetTab clientId={clientId} clientName={client.name} />
        </TabsContent>

        {/* Portal Access Tab */}
        <TabsContent value="portal">
          <PortalAccessTab clientId={clientId} clientName={client.name} />
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <BrandingTab clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Budget Tab Component
function BudgetTab({ clientId, clientName }: { clientId: number; clientName: string }) {
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [alertThreshold, setAlertThreshold] = useState(80);
  
  const { data: client, refetch } = trpc.clients.getById.useQuery({ id: clientId });
  const { data: budgetStatus } = trpc.clients.getBudgetStatus.useQuery(
    { clientId },
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );
  const updateMutation = trpc.clients.update.useMutation();

  useEffect(() => {
    if (client) {
      setMonthlyBudget(client.monthlyBudget || "0.00");
      setAlertThreshold(client.budgetAlertThreshold || 80);
    }
  }, [client]);

  const handleSaveBudget = async () => {
    try {
      await updateMutation.mutateAsync({
        id: clientId,
        monthlyBudget,
        budgetAlertThreshold: alertThreshold,
      });
      toast.success("Budget settings saved");
      refetch();
    } catch {
      toast.error("Failed to save budget settings");
    }
  };

  const currentCost = budgetStatus?.currentCost || 0;
  const budget = budgetStatus?.budget || parseFloat(monthlyBudget) || 0;
  const percentage = budget > 0 ? (currentCost / budget) * 100 : 0;
  const isOverBudget = percentage > 100;
  const isNearThreshold = percentage >= alertThreshold && !isOverBudget;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Settings for {clientName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="monthlyBudget">Monthly Budget (USD)</Label>
              <Input
                id="monthlyBudget"
                type="number"
                step="0.01"
                min="0"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Set to 0 to disable budget tracking
              </p>
            </div>
            <div>
              <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
              <Input
                id="alertThreshold"
                type="number"
                min="0"
                max="100"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Receive notification when spending reaches this percentage
              </p>
            </div>
          </div>
          <Button onClick={handleSaveBudget} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Budget Settings
          </Button>
        </CardContent>
      </Card>

      {budget > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Current Month Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Spend</span>
              <span className="text-2xl font-bold">${currentCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monthly Budget</span>
              <span className="text-lg font-medium">${budget.toFixed(2)}</span>
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Budget Usage</span>
                <span
                  className={`text-sm font-bold ${
                    isOverBudget
                      ? "text-red-400"
                      : isNearThreshold
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isOverBudget
                      ? "bg-red-500"
                      : isNearThreshold
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
            {isOverBudget && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Budget exceeded! Consider adjusting the budget or reducing content generation.
                </p>
              </div>
            )}
            {isNearThreshold && !isOverBudget && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Approaching budget threshold. You'll receive a notification if spending continues.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


// Portal Access Tab Component
function PortalAccessTab({ clientId, clientName }: { clientId: number; clientName: string }) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"client_admin" | "client_viewer">("client_viewer");
  const [lastInvitation, setLastInvitation] = useState<any>(null);

  const { data: portalUsers, refetch } = trpc.clientPortal.listUsers.useQuery({ clientId });
  const createInvitationMutation = trpc.clientPortal.createInvitation.useMutation();
  const deactivateUserMutation = trpc.clientPortal.deactivateUser.useMutation();

  const handleSendInvitation = async () => {
    if (!inviteEmail || !inviteName) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await createInvitationMutation.mutateAsync({
        clientId,
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
      });

      setLastInvitation(result);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteName("");
      setShowInviteDialog(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    }
  };

  const handleDeactivateUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to deactivate ${userName}'s portal access?`)) {
      return;
    }

    try {
      await deactivateUserMutation.mutateAsync({ userId });
      toast.success(`${userName}'s portal access has been deactivated`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate user");
    }
  };

  const copyInvitationLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/portal/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invitation link copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Portal Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Client Portal Access
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Invite {clientName} team members to access their content portal
              </p>
            </div>
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Portal URL</h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-3 py-2 rounded text-sm">
                {window.location.origin}/portal
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/portal`);
                  toast.success("Portal URL copied");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Invitation */}
      {lastInvitation && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-base">Recent Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Invited User</Label>
              <p className="font-medium">{lastInvitation.name} ({lastInvitation.email})</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Invitation Link</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-xs overflow-x-auto">
                  {window.location.origin}/portal/accept-invitation?token={lastInvitation.token}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyInvitationLink(lastInvitation.token)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this link with the user to complete their registration
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Portal Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Portal Users</CardTitle>
        </CardHeader>
        <CardContent>
          {!portalUsers || portalUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No portal users yet</p>
              <p className="text-sm mt-1">Invite team members to access the client portal</p>
            </div>
          ) : (
            <div className="space-y-3">
              {portalUsers.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.role === "client_admin" ? "default" : "secondary"}>
                      {user.role === "client_admin" ? "Admin" : "Viewer"}
                    </Badge>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {user.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivateUser(user.id, user.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Invite User to Portal</CardTitle>
              <p className="text-sm text-muted-foreground">
                Send an invitation to access the client portal
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Name</Label>
                <Input
                  id="invite-name"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="john@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "client_admin" | "client_viewer")}
                >
                  <option value="client_viewer">Viewer - Can view and approve content</option>
                  <option value="client_admin">Admin - Full portal access</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowInviteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSendInvitation}
                  disabled={createInvitationMutation.isPending}
                >
                  {createInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


// Branding Tab Component
function BrandingTab({ clientId }: { clientId: number }) {
  const { data: branding, refetch } = trpc.portalBranding.get.useQuery({ clientId });
  const upsertMutation = trpc.portalBranding.upsert.useMutation();
  
  const [formData, setFormData] = useState({
    logoUrl: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#1e40af",
    portalName: "",
    welcomeMessage: "",
  });

  useEffect(() => {
    if (branding) {
      setFormData({
        logoUrl: branding.logoUrl || "",
        primaryColor: branding.primaryColor || "#3b82f6",
        secondaryColor: branding.secondaryColor || "#1e40af",
        portalName: branding.portalName || "",
        welcomeMessage: branding.welcomeMessage || "",
      });
    }
  }, [branding]);

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync({
        clientId,
        ...formData,
      });
      toast.success("Branding settings saved successfully!");
      refetch();
    } catch {
      toast.error("Failed to save branding settings");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Portal Branding
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize the appearance of the client portal for this client
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="portal-name">Portal Name</Label>
            <Input
              id="portal-name"
              placeholder="Client Portal"
              value={formData.portalName}
              onChange={(e) => setFormData({ ...formData, portalName: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Displayed in the portal header
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-url">Logo URL</Label>
            <Input
              id="logo-url"
              placeholder="https://example.com/logo.png"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              URL to the logo image (recommended size: 200x50px)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-20 h-10 p-1"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-20 h-10 p-1"
                />
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcome-message">Welcome Message</Label>
            <Textarea
              id="welcome-message"
              placeholder="Welcome to your content portal!"
              value={formData.welcomeMessage}
              onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Shown on the portal dashboard
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Preview</h4>
            <div
              className="border rounded-lg p-6 space-y-4"
              style={{
                backgroundColor: `${formData.primaryColor}10`,
                borderColor: formData.primaryColor,
              }}
            >
              {formData.logoUrl && (
                <img
                  src={formData.logoUrl}
                  alt="Logo preview"
                  className="h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <h3
                className="text-2xl font-bold"
                style={{ color: formData.primaryColor }}
              >
                {formData.portalName || "Client Portal"}
              </h3>
              {formData.welcomeMessage && (
                <p className="text-sm" style={{ color: formData.secondaryColor }}>
                  {formData.welcomeMessage}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={upsertMutation.isPending}
            className="w-full"
          >
            {upsertMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Branding Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
