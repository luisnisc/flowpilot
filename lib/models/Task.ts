import { Schema, model, models } from "mongoose";

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending","in_progress","done"], default: "pending" },
  priority: { type: String, enum: ["high","medium","low"], default: "medium" }
}, { timestamps: true });

export default models.Task || model("Task", TaskSchema);