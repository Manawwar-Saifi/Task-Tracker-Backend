/**
 * Task Model
 *
 * Mongoose schema for task management with dependencies.
 */
import mongoose from "mongoose";

/**
 * Task Dependency Sub-Schema
 */
const dependencySchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "acknowledged", "completed", "cancelled"],
      default: "pending",
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

/**
 * Task Schema
 */
const taskSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assignee is required"],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed", "blocked", "cancelled"],
      default: "todo",
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    dependencies: {
      type: [dependencySchema],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
taskSchema.index({ organizationId: 1, status: 1 });
taskSchema.index({ organizationId: 1, userId: 1 });
taskSchema.index({ organizationId: 1, dueDate: 1 });
taskSchema.index({ organizationId: 1, teamId: 1 });
taskSchema.index({ organizationId: 1, isDeleted: 1 });

/**
 * Virtual: Check if task is overdue
 */
taskSchema.virtual("isOverdue").get(function () {
  if (
    !this.dueDate ||
    this.status === "completed" ||
    this.status === "cancelled"
  ) {
    return false;
  }
  return new Date() > new Date(this.dueDate);
});

/**
 * Virtual: Days until due
 */
taskSchema.virtual("daysUntilDue").get(function () {
  if (!this.dueDate) return null;
  const diff = new Date(this.dueDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

/**
 * Static: Get task with populated references
 */
taskSchema.statics.findWithDetails = function (id, organizationId) {
  return this.findOne({ _id: id, organizationId, isDeleted: false })
    .populate("userId", "firstName lastName email avatar")
    .populate("createdBy", "firstName lastName email")
    .populate("assignedBy", "firstName lastName email")
    .populate("teamId", "name")
    .populate("dependencies.taskId", "title status userId")
    .lean();
};

/**
 * Static: Get tasks by status
 */
taskSchema.statics.getByStatus = async function (organizationId, options = {}) {
  const { userId, teamId, includeHidden = false } = options;

  const query = {
    organizationId,
    isDeleted: false,
  };

  if (!includeHidden) {
    query.isVisible = true;
  }

  if (userId) {
    query.userId = userId;
  }

  if (teamId) {
    query.teamId = teamId;
  }

  const tasks = await this.find(query)
    .populate("userId", "firstName lastName email avatar")
    .sort({ priority: -1, dueDate: 1 })
    .lean();

  return {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    completed: tasks.filter((t) => t.status === "completed"),
    blocked: tasks.filter((t) => t.status === "blocked"),
  };
};

/**
 * Static: Get task statistics
 */
taskSchema.statics.getStats = async function (organizationId, options = {}) {
  const { userId, teamId } = options;

  const query = {
    organizationId,
    isDeleted: false,
    isVisible: true,
  };

  if (userId) {
    query.userId = userId;
  }

  if (teamId) {
    query.teamId = teamId;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [statusCounts, overdueTasks, dueTodayTasks] = await Promise.all([
    this.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    this.countDocuments({
      ...query,
      dueDate: { $lt: today },
      status: { $nin: ["completed", "cancelled"] },
    }),
    this.countDocuments({
      ...query,
      dueDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      status: { $nin: ["completed", "cancelled"] },
    }),
  ]);

  const stats = {
    total: 0,
    todo: 0,
    in_progress: 0,
    completed: 0,
    blocked: 0,
    cancelled: 0,
    overdue: overdueTasks,
    dueToday: dueTodayTasks,
  };

  statusCounts.forEach((item) => {
    stats[item._id] = item.count;
    stats.total += item.count;
  });

  return stats;
};

/**
 * Static: Check for circular dependency
 */
taskSchema.statics.hasCircularDependency = async function (
  taskId,
  dependentTaskId,
  visited = new Set()
) {
  if (taskId.toString() === dependentTaskId.toString()) {
    return true;
  }

  if (visited.has(dependentTaskId.toString())) {
    return false;
  }

  visited.add(dependentTaskId.toString());

  const dependentTask = await this.findById(dependentTaskId);
  if (!dependentTask || !dependentTask.dependencies.length) {
    return false;
  }

  for (const dep of dependentTask.dependencies) {
    if (await this.hasCircularDependency(taskId, dep.taskId, visited)) {
      return true;
    }
  }

  return false;
};

/**
 * Static: Hide past-due tasks (scheduled job)
 */
taskSchema.statics.hidePastDueTasks = async function () {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  const result = await this.updateMany(
    {
      dueDate: { $lt: yesterday },
      status: { $nin: ["completed", "cancelled"] },
      isVisible: true,
    },
    { $set: { isVisible: false } }
  );

  return result.modifiedCount;
};

/**
 * Instance: Add dependency
 */
taskSchema.methods.addDependency = function (taskId) {
  const exists = this.dependencies.some(
    (d) => d.taskId.toString() === taskId.toString()
  );
  if (!exists) {
    this.dependencies.push({
      taskId,
      status: "pending",
      notifiedAt: new Date(),
    });
  }
  return this;
};

/**
 * Instance: Remove dependency
 */
taskSchema.methods.removeDependency = function (taskId) {
  this.dependencies = this.dependencies.filter(
    (d) => d.taskId.toString() !== taskId.toString()
  );
  return this;
};

/**
 * Instance: Update dependency status
 */
taskSchema.methods.updateDependencyStatus = function (taskId, status) {
  const dependency = this.dependencies.find(
    (d) => d.taskId.toString() === taskId.toString()
  );
  if (dependency) {
    dependency.status = status;
    if (status === "acknowledged") {
      dependency.acknowledgedAt = new Date();
    } else if (status === "completed") {
      dependency.completedAt = new Date();
    }
  }
  return this;
};

/**
 * Instance: Check if all dependencies are completed
 */
taskSchema.methods.allDependenciesCompleted = function () {
  if (!this.dependencies.length) return true;
  return this.dependencies.every((d) => d.status === "completed");
};

/**
 * Instance: Mark as completed
 */
taskSchema.methods.markCompleted = function (userId) {
  this.status = "completed";
  this.progress = 100;
  this.completedAt = new Date();
  this.updatedBy = userId;
  return this;
};

const Task = mongoose.model("Task", taskSchema);

export default Task;
