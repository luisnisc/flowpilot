import { Schema, model, models } from "mongoose";

const MemberSubSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  role: { type: String, enum: ["admin","collaborator"], default: "collaborator" }
});

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  members: [MemberSubSchema],
}, { timestamps: true });

export default models.Project || model("Project", ProjectSchema);