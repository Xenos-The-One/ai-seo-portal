import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, TrendingUp, LogOut, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PortalDashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("client_portal_token");
    const userData = localStorage.getItem("client_portal_user");
    
    if (!token || !userData) {
      setLocation("/portal/login");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Fetch branding settings
    if (parsedUser.clientId) {
      fetch(`/api/trpc/portalBranding.get?input=${encodeURIComponent(JSON.stringify({ clientId: parsedUser.clientId }))}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.result?.data) {
            setBranding(data.result.data);
          }
        })
        .catch(() => {});
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("client_portal_token");
    localStorage.removeItem("client_portal_user");
    setLocation("/portal/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card" style={branding?.primaryColor ? { borderColor: branding.primaryColor } : {}}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {branding?.logoUrl && (
              <img src={branding.logoUrl} alt="Logo" className="h-10 object-contain" />
            )}
            <div>
              <h1 className="text-2xl font-bold" style={branding?.primaryColor ? { color: branding.primaryColor } : {}}>
                {branding?.portalName || "Client Portal"}
              </h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role === "client_admin" ? "Admin" : "Viewer"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Content</p>
                <p className="text-3xl font-bold mt-2">0</p>
              </div>
              <FileText className="h-12 w-12 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-3xl font-bold mt-2">0</p>
              </div>
              <Calendar className="h-12 w-12 text-orange-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-3xl font-bold mt-2">0</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/portal/content">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <FileText className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">My Content</h3>
              <p className="text-muted-foreground">
                View all your content, drafts, and published posts
              </p>
            </Card>
          </Link>

          <Link href="/portal/calendar">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Content Calendar</h3>
              <p className="text-muted-foreground">
                See your content schedule and upcoming posts
              </p>
            </Card>
          </Link>

          <Link href="/portal/performance">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Performance</h3>
              <p className="text-muted-foreground">
                Track views, engagement, and content performance
              </p>
            </Card>
          </Link>

          <Link href="/portal/approvals">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <User className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Approvals</h3>
              <p className="text-muted-foreground">
                Review and approve content awaiting your feedback
              </p>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="text-center py-12 text-muted-foreground">
            <p>No recent activity</p>
            <p className="text-sm mt-2">Activity will appear here as content is created and updated</p>
          </div>
        </Card>
      </main>
    </div>
  );
}
