import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user","admin"], default: "user" },
  projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
}, { timestamps: true });

export default models.User || model("User", UserSchema);