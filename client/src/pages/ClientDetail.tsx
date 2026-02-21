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
