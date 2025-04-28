import { Schema, model, models } from "mongoose";

const CommentSchema = new Schema({
  content: { type: String, required: true },
  task: { type: Schema.Types.ObjectId, ref: "Task" },
  author: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default models.Comment || model("Comment", CommentSchema);