import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, History, Eye, ArrowRight, Star } from "lucide-react";
import type { Project, ProjectStatus } from "@/types/project";

interface ProjectsSectionProps {
  projects: Project[];
  projectStatuses: ProjectStatus[];
  onOpenModal: (type: "memo" | "eod", projectId: string) => void;
  onToggleActive: (projectId: string, currentStatus: boolean) => void;
}

/**
 * Dashboard section displaying active projects with their update status
 */
export const ProjectsSection = React.memo(function ProjectsSection({
  projects,
  projectStatuses,
  onOpenModal,
  onToggleActive,
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
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {status?.hasTodayMemo ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs">
                            ✓ Memo
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs">
                            ⏳ Memo Pending
                          </Badge>
                        )}

                        {status?.hasTodayEod ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs">
                            ✓ EOD
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs">
                            ⏳ EOD Pending
                          </Badge>
                        )}

                        {!status?.hasYesterdayEod && (
                          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs">
                            ✗ Yesterday's EOD
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => onOpenModal("memo", project.id)}
                        title="Add Update"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Link
                        href={`/user/projects/${project.id}/updates-history`}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          title="History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/user/projects/${project.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                          title="View Project"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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
