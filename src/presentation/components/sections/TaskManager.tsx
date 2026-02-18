import { useState } from "react";
import { Plus, CheckCircle2, Circle, Clock, AlertCircle, Calendar, ChevronDown, MoreHorizontal } from "lucide-react";
import { useTaskStore } from "@presentation/state/taskStore";
import { cn } from "@presentation/lib/cn";
import type { TaskStatus } from "@domain/entities/Task";

const statusColumns: Array<{ id: TaskStatus; label: string; color: string }> = [
  { id: "backlog", label: "Backlog", color: "text-gray-400" },
  { id: "todo", label: "To Do", color: "text-blue-400" },
  { id: "in_progress", label: "In Progress", color: "text-yellow-400" },
  { id: "done", label: "Done", color: "text-green-400" }
];

const priorityColors: Record<string, string> = {
  low: "bg-gray-500/20 text-gray-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400"
};

export const TaskManager = () => {
  const projects = useTaskStore((state) => state.projects);
  const currentProject = useTaskStore((state) => state.currentProject);
  const tasks = useTaskStore((state) => state.tasks);
  const createProject = useTaskStore((state) => state.createProject);
  const createTask = useTaskStore((state) => state.createTask);
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus);
  const selectProject = useTaskStore((state) => state.selectProject);
  const loading = useTaskStore((state) => state.loading);

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;
    await createProject(newProjectTitle);
    setNewProjectTitle("");
    setShowCreateProject(false);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createTask(
      newTaskTitle,
      newTaskDescription,
      currentProject?.id || null
    );
    setNewTaskTitle("");
    setNewTaskDescription("");
    setShowCreateTask(false);
  };

  const handleDropTask = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    let filtered = tasks;
    if (currentProject) {
      filtered = tasks.filter(t => t.projectId === currentProject.id);
    }
    return filtered.filter(t => t.status === status);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-white/60">Loading tasks...</div>
      </div>
    );
  }

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">File & Task Manager</p>
            <h1 className="text-xl font-semibold">Organize Your Work</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-white/5 p-1">
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  viewMode === "kanban" ? "bg-highlight text-black" : "text-white/60 hover:text-white"
                )}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  viewMode === "list" ? "bg-highlight text-black" : "text-white/60 hover:text-white"
                )}
              >
                List
              </button>
            </div>
            <button
              onClick={() => setShowCreateTask(true)}
              className="flex items-center gap-2 rounded-full bg-highlight px-4 py-2 text-sm font-semibold text-black shadow-glow transition hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-white/5 bg-black/20 p-4 overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">Projects</h2>
            <button
              onClick={() => setShowCreateProject(true)}
              className="rounded-lg p-1 text-white/40 hover:bg-white/5 hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => selectProject("all")}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                !currentProject
                  ? "bg-highlight/10 text-highlight"
                  : "text-white/60 hover:bg-white/5"
              )}
            >
              <Circle className="h-4 w-4 shrink-0" />
              <span className="text-sm">All Tasks</span>
            </button>

            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => selectProject(project.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                  currentProject?.id === project.id
                    ? "bg-highlight/10 text-highlight"
                    : "text-white/60 hover:bg-white/5"
                )}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{project.title}</p>
                </div>
              </button>
            ))}

            {projects.length === 0 && (
              <p className="px-3 py-2 text-sm text-white/40">No projects yet</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          {viewMode === "kanban" ? (
            <div className="flex h-full gap-4 overflow-x-auto">
              {statusColumns.map((column) => {
                const columnTasks = getTasksByStatus(column.id);

                return (
                  <div
                    key={column.id}
                    className="flex w-72 flex-shrink-0 flex-col rounded-xl border border-white/5 bg-white/5"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const taskId = e.dataTransfer.getData("taskId");
                      if (taskId) {
                        handleDropTask(taskId, column.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={column.color}>●</span>
                        <span className="text-sm font-medium">{column.label}</span>
                      </div>
                      <span className="text-xs text-white/40">{columnTasks.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                      <div className="space-y-2">
                        {columnTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("taskId", task.id);
                            }}
                            className="rounded-lg border border-white/5 bg-black/40 p-3 transition hover:border-white/10"
                          >
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-medium text-white">{task.title}</p>
                              <span className={cn("rounded px-1.5 py-0.5 text-xs", priorityColors[task.priority])}>
                                {task.priority}
                              </span>
                            </div>
                            {task.description && (
                              <p className="mt-1 text-xs text-white/50 line-clamp-2">{task.description}</p>
                            )}
                            {task.dueDate && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-white/40">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}

                        {columnTasks.length === 0 && (
                          <div className="p-4 text-center text-xs text-white/30">
                            No tasks
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#0b0d10]">
                  <tr className="border-b border-white/5 text-left text-xs text-white/40">
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-white/5 transition hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-white/50">{task.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "rounded-full px-2 py-1 text-xs",
                          task.status === "done" ? "bg-green-500/20 text-green-400" :
                          task.status === "in_progress" ? "bg-yellow-500/20 text-yellow-400" :
                          task.status === "todo" ? "bg-blue-500/20 text-blue-400" :
                          "bg-gray-500/20 text-gray-400"
                        )}>
                          {task.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded px-2 py-0.5 text-xs", priorityColors[task.priority])}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}

                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-white/40">
                        No tasks yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d10] p-6">
            <h2 className="text-lg font-semibold">Create Project</h2>
            <p className="mt-1 text-sm text-white/50">Organize tasks into projects.</p>

            <div className="mt-6">
              <label className="text-xs uppercase tracking-wider text-white/40">Project Name</label>
              <input
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="e.g., Website Redesign"
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateProject(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectTitle.trim()}
                className="rounded-lg bg-highlight px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d10] p-6">
            <h2 className="text-lg font-semibold">Create Task</h2>
            <p className="mt-1 text-sm text-white/50">Add a new task to your list.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40">Task Title</label>
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40">Description</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={3}
                  placeholder="Add more details..."
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-highlight focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateTask(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className="rounded-lg bg-highlight px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};