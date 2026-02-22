import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function DesignStandards() {
  const [isInitializing, setIsInitializing] = useState(false);
  
  const { data: standards, refetch } = trpc.designStandards.getAll.useQuery();
  const initializeMutation = trpc.designStandards.initializeDefault.useMutation();

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const result = await initializeMutation.mutateAsync();
      if (result.success) {
        toast.success(result.message);
        refetch();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to initialize design standard");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Design Standards</h1>
        <p className="text-muted-foreground">
          Manage your agency's design guidelines for Manus website creation
        </p>
      </div>

      {!standards || standards.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              No Design Standards Found
            </CardTitle>
            <CardDescription>
              Initialize your default Takeoff Premium Design standard to start creating elite, motion-driven websites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInitialize} disabled={isInitializing}>
              {isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Palette className="h-4 w-4 mr-2" />
                  Initialize Takeoff Design Standard
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {standards.map((standard) => (
            <Card key={standard.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{standard.name}</CardTitle>
                      {standard.isDefault === 1 && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {standard.description && (
                      <CardDescription>{standard.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {standard.colorScheme && (
                    <div>
                      <span className="text-muted-foreground">Color Scheme:</span>
                      <p className="font-medium capitalize">{standard.colorScheme}</p>
                    </div>
                  )}
                  {standard.designStyle && (
                    <div>
                      <span className="text-muted-foreground">Design Style:</span>
                      <p className="font-medium capitalize">{standard.designStyle}</p>
                    </div>
                  )}
                </div>

                {standard.referenceUrl && (
                  <div>
                    <span className="text-sm text-muted-foreground">Reference URL:</span>
                    <a
                      href={standard.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {standard.referenceUrl}
                    </a>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium mb-2 block">Design Prompt:</span>
                  <div className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {standard.designPrompt}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created: {new Date(standard.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
