import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type ViewMode = "month" | "week";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [, navigate] = useLocation();

  const { data: content, refetch } = trpc.content.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const updateContent = trpc.content.update.useMutation();

  // Filter content by client
  const filteredContent = useMemo(() => {
    if (!content) return [];
    if (selectedClient === "all") return content;
    return content.filter(c => c.content.clientId === parseInt(selectedClient));
  }, [content, selectedClient]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentDate]);

  // Get content for a specific date
  const getContentForDate = (date: Date | null) => {
    if (!date || !filteredContent) return [];
    
    return filteredContent.filter(item => {
      if (!item.content.scheduledPublishDate) return false;
      const scheduledDate = new Date(item.content.scheduledPublishDate);
      return (
        scheduledDate.getDate() === date.getDate() &&
        scheduledDate.getMonth() === date.getMonth() &&
        scheduledDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, contentId: number) => {
    e.dataTransfer.setData("contentId", contentId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date | null) => {
    e.preventDefault();
    if (!targetDate) return;

    const contentId = parseInt(e.dataTransfer.getData("contentId"));
    const contentItem = content?.find(c => c.content.id === contentId);
    
    if (!contentItem) return;

    try {
      // Set time to noon to avoid timezone issues
      const scheduledDate = new Date(targetDate);
      scheduledDate.setHours(12, 0, 0, 0);

      await updateContent.mutateAsync({
        id: contentId,
        scheduledPublishDate: scheduledDate.toISOString(),
      });

      toast.success("Content rescheduled successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to reschedule content");
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "in-review": return "bg-yellow-500";
      case "approved": return "bg-green-500";
      case "published": return "bg-blue-500";
      case "scheduled": return "bg-purple-500";
      default: return "bg-gray-400";
    }
  };

  // Get client color (cycle through colors)
  const getClientColor = (clientId: number) => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-lime-500",
      "bg-emerald-500",
      "bg-cyan-500",
      "bg-sky-500",
      "bg-indigo-500",
      "bg-violet-500",
      "bg-fuchsia-500",
      "bg-pink-500",
      "bg-rose-500",
    ];
    return colors[clientId % colors.length];
  };

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Schedule and manage your content publication dates
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients?.map(client => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={goToToday}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold min-w-[200px] text-center">{monthName}</h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-6 text-sm">
          <span className="font-semibold">Status:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-500"></div>
            <span>Draft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span>In Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Published</span>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="p-6">
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const dayContent = getContentForDate(date);
            const isToday = date && 
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={index}
                className={`min-h-[120px] border rounded-lg p-2 ${
                  date ? "bg-card" : "bg-muted/20"
                } ${isToday ? "ring-2 ring-primary" : ""}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, date)}
              >
                {date && (
                  <>
                    <div className="text-sm font-medium mb-2 text-foreground">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayContent.map(item => (
                        <div
                          key={item.content.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.content.id)}
                          className={`text-xs p-1.5 rounded cursor-move hover:opacity-80 transition-opacity ${
                            selectedClient === "all" 
                              ? getClientColor(item.content.clientId)
                              : getStatusColor(item.content.status)
                          } text-white truncate`}
                          onClick={() => navigate(`/content/${item.content.id}`)}
                          title={item.content.title}
                        >
                          {item.content.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Unscheduled Content */}
      {filteredContent && filteredContent.filter(c => !c.content.scheduledPublishDate).length > 0 && (
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Unscheduled Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredContent
              .filter(c => !c.content.scheduledPublishDate)
              .map(item => (
                <div
                  key={item.content.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.content.id)}
                  className={`p-3 rounded cursor-move hover:opacity-80 transition-opacity ${
                    selectedClient === "all"
                      ? getClientColor(item.content.clientId)
                      : getStatusColor(item.content.status)
                  } text-white`}
                  onClick={() => navigate(`/content/${item.content.id}`)}
                >
                  <div className="font-medium truncate">{item.content.title}</div>
                  <div className="text-xs opacity-90 mt-1">{item.client?.name || "Unknown Client"}</div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
