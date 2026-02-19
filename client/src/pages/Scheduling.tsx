import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";

export default function Scheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [publishDate, setPublishDate] = useState("");

  const { data: contentList } = trpc.content.list.useQuery();
  const scheduleMutation = trpc.content.schedule.useMutation();

  const scheduledContent = useMemo(() => {
    return contentList?.filter(item => item.content.isScheduled) || [];
  }, [contentList]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const contentByDate = useMemo(() => {
    const map: { [key: string]: any[] } = {};
    scheduledContent.forEach(item => {
      if (item.content.scheduledPublishDate) {
        const dateStr = format(new Date(item.content.scheduledPublishDate), "yyyy-MM-dd");
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(item);
      }
    });
    return map;
  }, [scheduledContent]);

  const handleSchedule = async () => {
    if (!selectedContentId || !publishDate) {
      toast.error("Please select content and a date");
      return;
    }

    try {
      await scheduleMutation.mutateAsync({
        contentId: selectedContentId,
        scheduledPublishDate: new Date(publishDate),
      });
      toast.success("Content scheduled successfully");
      setIsOpen(false);
      setPublishDate("");
      setSelectedContentId(null);
    } catch (error) {
      toast.error("Failed to schedule content");
    }
  };

  const unscheduledContent = contentList?.filter(item => !item.content.isScheduled) || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Scheduling</h1>
          <p className="text-muted-foreground mt-2">
            Plan and schedule your content publication
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Content
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Content for Publication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="content">Select Content</Label>
                <select
                  id="content"
                  value={selectedContentId || ""}
                  onChange={(e) => setSelectedContentId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                >
                  <option value="">Choose content...</option>
                  {unscheduledContent.map(item => (
                    <option key={item.content.id} value={item.content.id}>
                      {item.content.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="date">Publish Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSchedule} disabled={scheduleMutation.isPending}>
                  Schedule
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{format(selectedDate, "MMMM yyyy")}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                  >
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                {daysInMonth.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayContent = contentByDate[dateStr] || [];
                  const isCurrentMonth = isSameMonth(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={dateStr}
                      className={`p-2 rounded-lg border text-center text-sm min-h-20 flex flex-col ${
                        !isCurrentMonth ? "opacity-50 bg-muted" : ""
                      } ${isTodayDate ? "border-primary bg-accent" : "border-border"}`}
                    >
                      <div className="font-semibold">{day.getDate()}</div>
                      {dayContent.length > 0 && (
                        <div className="mt-1 space-y-1 flex-1">
                          {dayContent.slice(0, 2).map(item => (
                            <div
                              key={item.content.id}
                              className="text-xs bg-primary text-primary-foreground rounded px-1 py-0.5 truncate"
                            >
                              {item.content.title}
                            </div>
                          ))}
                          {dayContent.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayContent.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Schedule */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledContent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scheduled content</p>
              ) : (
                <div className="space-y-3">
                  {scheduledContent
                    .filter(item => item.content.scheduledPublishDate)
                    .sort((a, b) => {
                      const dateA = new Date(a.content.scheduledPublishDate || 0).getTime();
                      const dateB = new Date(b.content.scheduledPublishDate || 0).getTime();
                      return dateA - dateB;
                    })
                    .slice(0, 5)
                    .map(item => (
                      <div
                        key={item.content.id}
                        className="p-3 rounded-lg border border-border bg-card"
                      >
                        <p className="text-sm font-medium truncate">{item.content.title}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(item.content.scheduledPublishDate || 0), "MMM d, h:mm a")}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scheduled</span>
                <span className="font-medium">{scheduledContent.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unscheduled</span>
                <span className="font-medium">{unscheduledContent.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{(contentList?.length || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
