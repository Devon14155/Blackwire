import { create } from "zustand";
import { horizonDB } from "@core/database/horizonDB";
import type { Project, ProjectStatus, ProjectPriority } from "@domain/entities/Project";
import type { Task, TaskStatus, TaskPriority } from "@domain/entities/Task";
import { createId } from "@core/utils/uuid";

interface TaskState {
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  filteredTasks: Task[];
  currentTask: Task | null;
  taskFilter: "all" | TaskStatus;
  loading: boolean;
  error?: string;

  initialize: () => Promise<void>;

  createProject: (title: string, description?: string, priority?: ProjectPriority, dueDate?: number | null) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (id: string) => Promise<void>;

  createTask: (title: string, description?: string, projectId?: string | null, priority?: TaskPriority, dueDate?: number | null) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  selectTask: (id: string) => Promise<void>;
  setTaskFilter: (filter: "all" | TaskStatus) => void;
  getTasksByProject: (projectId: string) => Promise<Task[]>;
  getOverdueTasks: () => Promise<Task[]>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  projects: [],
  currentProject: null,
  tasks: [],
  filteredTasks: [],
  currentTask: null,
  taskFilter: "all",
  loading: false,
  error: undefined,

  initialize: async () => {
    set({ loading: true, error: undefined });
    try {
      const [projects, tasks] = await Promise.all([
        horizonDB.projects.toArray(),
        horizonDB.tasks.toArray()
      ]);

      set({
        projects,
        tasks,
        filteredTasks: tasks,
        loading: false
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },

  createProject: async (title, description = "", priority = "medium", dueDate = null) => {
    const now = Date.now();
    const project: Project = {
      id: createId(),
      title,
      description,
      status: "planning",
      priority,
      dueDate,
      completedAt: null,
      color: "#ff7a18",
      createdAt: now,
      updatedAt: now
    };

    await horizonDB.projects.add(project);
    set(state => ({ projects: [...state.projects, project] }));
    return project;
  },

  updateProject: async (id, updates) => {
    await horizonDB.projects.update(id, {
      ...updates,
      updatedAt: Date.now()
    });

    set(state => ({
      projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
      currentProject: state.currentProject?.id === id
        ? { ...state.currentProject, ...updates }
        : state.currentProject
    }));
  },

  updateProjectStatus: async (id, status) => {
    const updates: Partial<Project> = { status, updatedAt: Date.now() };
    if (status === "completed") {
      updates.completedAt = Date.now();
    }

    await horizonDB.projects.update(id, updates);

    set(state => ({
      projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
      currentProject: state.currentProject?.id === id
        ? { ...state.currentProject, ...updates }
        : state.currentProject
    }));
  },

  deleteProject: async (id) => {
    await horizonDB.projects.delete(id);
    await horizonDB.tasks.where("projectId").equals(id).delete();

    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
      tasks: state.tasks.filter(t => t.projectId !== id)
    }));
  },

  selectProject: async (id) => {
    const project = await horizonDB.projects.get(id);
    const tasks = await horizonDB.tasks.where("projectId").equals(id).toArray();

    set({
      currentProject: project || null,
      filteredTasks: tasks
    });
  },

  createTask: async (title, description = "", projectId = null, priority = "medium", dueDate = null) => {
    const now = Date.now();
    const task: Task = {
      id: createId(),
      projectId,
      title,
      description,
      status: "todo",
      priority,
      dueDate,
      completedAt: null,
      estimatedMinutes: null,
      actualMinutes: null,
      dependencies: [],
      labels: [],
      embeddingId: null,
      createdAt: now,
      updatedAt: now
    };

    await horizonDB.tasks.add(task);
    set(state => ({
      tasks: [...state.tasks, task],
      filteredTasks: state.taskFilter === "all" || task.status === state.taskFilter
        ? [...state.filteredTasks, task]
        : state.filteredTasks
    }));

    return task;
  },

  updateTask: async (id, updates) => {
    await horizonDB.tasks.update(id, {
      ...updates,
      updatedAt: Date.now()
    });

    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
      filteredTasks: state.filteredTasks.map(t => t.id === id ? { ...t, ...updates } : t),
      currentTask: state.currentTask?.id === id
        ? { ...state.currentTask, ...updates }
        : state.currentTask
    }));
  },

  updateTaskStatus: async (id, status) => {
    const updates: Partial<Task> = { status, updatedAt: Date.now() };
    if (status === "done") {
      updates.completedAt = Date.now();
    }

    await horizonDB.tasks.update(id, updates);

    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
      filteredTasks: state.taskFilter === "all"
        ? state.filteredTasks.map(t => t.id === id ? { ...t, ...updates } : t)
        : state.filteredTasks.filter(t => t.id !== id),
      currentTask: state.currentTask?.id === id
        ? { ...state.currentTask, ...updates }
        : state.currentTask
    }));
  },

  deleteTask: async (id) => {
    await horizonDB.tasks.delete(id);
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id),
      filteredTasks: state.filteredTasks.filter(t => t.id !== id),
      currentTask: state.currentTask?.id === id ? null : state.currentTask
    }));
  },

  selectTask: async (id) => {
    const task = await horizonDB.tasks.get(id);
    set({ currentTask: task || null });
  },

  setTaskFilter: (filter) => {
    const { tasks } = get();
    set({
      taskFilter: filter,
      filteredTasks: filter === "all" ? tasks : tasks.filter(t => t.status === filter)
    });
  },

  getTasksByProject: async (projectId) => {
    const tasks = await horizonDB.tasks.where("projectId").equals(projectId).toArray();
    return tasks;
  },

  getOverdueTasks: async () => {
    const now = Date.now();
    const tasks = await horizonDB.tasks
      .filter(t => t.dueDate !== null && t.dueDate < now && t.status !== "done")
      .toArray();
    return tasks;
  }
}));