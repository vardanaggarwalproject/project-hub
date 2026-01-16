import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, History, Eye, ExternalLink, ArrowRight, Star, AlertCircle } from "lucide-react";
import type { Project, ProjectStatus } from "@/types/project";

interface ProjectsSectionProps {
  projects: Project[];
  projectStatuses: ProjectStatus[];
  onOpenModal: (type: "memo" | "eod", projectId: string, date?: string) => void;
  onToggleActive: (projectId: string, currentStatus: boolean) => void;
  onHistoryClick: (projectId: string) => void;
}

/**
 * Dashboard section displaying active projects with their update status
 */
export const ProjectsSection = React.memo(function ProjectsSection({
  projects,
  projectStatuses,
  onOpenModal,
  onToggleActive,
  onHistoryClick,
}: ProjectsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-900">
          Projects Updates
        </h2>
        <Link href="/user/projects">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      <Card className="border border-slate-200 rounded-xl overflow-hidden">
        {projects.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3 opacity-50">📂</div>
            <p className="text-sm text-slate-400">No projects assigned yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.map((project) => {
              const status = projectStatuses.find(
                (s) => s.projectId === project.id
              );

              return (
                <div
                  key={project.id}
                  className="p-4 hover:bg-slate-50 transition-colors duration-150"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <h3 className="text-sm font-semibold text-slate-900">
                          {project.name}
                        </h3>
                        {project.isMemoRequired && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] px-1.5 py-0 h-5 cursor-help"
                                >
                                  <AlertCircle className="h-3 w-3 mr-0.5" />
                                  140 Memo
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-xs">This project requires detailed memos (maximum 140 characters)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          className={`text-xs cursor-pointer transition-colors ${
                            status?.hasTodayMemo
                              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                              : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                          }`}
                          onClick={() => onOpenModal("memo", project.id)}
                        >
                          {status?.hasTodayMemo ? "✓ Memo" : "⏳ Memo Pending"}
                        </Badge>

                        <Badge
                          className={`text-xs cursor-pointer transition-colors ${
                            status?.hasTodayEod
                              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                              : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                          }`}
                          onClick={() => onOpenModal("eod", project.id)}
                        >
                          {status?.hasTodayEod ? "✓ EOD" : "⏳ EOD Pending"}
                        </Badge>

                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {!(status?.hasTodayMemo && status?.hasTodayEod) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => onOpenModal("memo", project.id)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Add Update</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={() => onHistoryClick(project.id)}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>History</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/user/projects/${project.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Project</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="w-px h-6 bg-slate-200 mx-1" />
                      <Switch
                        checked={true}
                        onCheckedChange={() =>
                          onToggleActive(project.id, true)
                        }
                        className="scale-90 cursor-pointer"
                        title="Toggle Active Status"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
});
