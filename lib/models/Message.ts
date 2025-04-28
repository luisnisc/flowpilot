import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema({
  content: { type: String, required: true },
  project: { type: Schema.Types.ObjectId, ref: "Project" },
  author: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default models.Message || model("Message", MessageSchema);