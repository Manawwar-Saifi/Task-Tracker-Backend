/**
 * Notification Model
 *
 * Mongoose schema for notification management.
 * Supports real-time notifications via Socket.io.
 */
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    type: {
      type: String,
      enum: [
        "leave_request",
        "leave_approved",
        "leave_rejected",
        "task_assigned",
        "task_completed",
        "overtime_request",
        "overtime_approved",
        "overtime_rejected",
        "team_added",
        "team_removed",
        "mention",
        "announcement",
        "system",
        "other",
      ],
      required: [true, "Notification type is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: 1000,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    link: {
      type: String,
      trim: true,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    icon: {
      type: String,
      trim: true,
      default: null,
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
notificationSchema.index({ organizationId: 1, userId: 1, isRead: 1 });
notificationSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { sparse: true });

/**
 * Virtual: Check if notification is expired
 */
notificationSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

/**
 * Static: Get notifications for user
 */
notificationSchema.statics.getNotifications = async function (
  organizationId,
  userId,
  options = {}
) {
  const {
    page = 1,
    limit = 20,
    type,
    isRead,
    priority,
    startDate,
    endDate,
  } = options;

  const query = {
    organizationId,
    userId,
    isDeleted: false,
  };

  if (type) query.type = type;
  if (isRead !== undefined) query.isRead = isRead;
  if (priority) query.priority = priority;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [notifications, total, unreadCount] = await Promise.all([
    this.find(query)
      .populate("actionBy", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
    this.countDocuments({ organizationId, userId, isRead: false, isDeleted: false }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    unreadCount,
  };
};

/**
 * Static: Get unread count
 */
notificationSchema.statics.getUnreadCount = async function (organizationId, userId) {
  return this.countDocuments({
    organizationId,
    userId,
    isRead: false,
    isDeleted: false,
  });
};

/**
 * Static: Mark all as read
 */
notificationSchema.statics.markAllAsRead = async function (organizationId, userId) {
  const result = await this.updateMany(
    {
      organizationId,
      userId,
      isRead: false,
      isDeleted: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  return result.modifiedCount;
};

/**
 * Static: Delete all read notifications
 */
notificationSchema.statics.deleteAllRead = async function (organizationId, userId) {
  const result = await this.updateMany(
    {
      organizationId,
      userId,
      isRead: true,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
      },
    }
  );

  return result.modifiedCount;
};

/**
 * Static: Get notification stats
 */
notificationSchema.statics.getStats = async function (organizationId, userId) {
  const results = await this.aggregate([
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
        },
      },
    },
  ]);

  const stats = {
    total: 0,
    unread: 0,
    byType: {},
  };

  results.forEach((item) => {
    stats.total += item.count;
    stats.unread += item.unread;
    stats.byType[item._id] = {
      total: item.count,
      unread: item.unread,
    };
  });

  return stats;
};

/**
 * Instance: Mark as read
 */
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this;
};

/**
 * Instance: Mark as unread
 */
notificationSchema.methods.markAsUnread = function () {
  this.isRead = false;
  this.readAt = null;
  return this;
};

/**
 * Pre-save hook: Auto-delete expired notifications
 */
notificationSchema.pre("save", function (next) {
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.isDeleted = true;
  }
  next();
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
