"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SideBar from "@/app/components/SideBar";
import ProjectDetails from "../../components/ProjectDetails";

export default function ProjectDetail() {
  const params = useParams();
  const projectId = params.id as string;
  
  return (
    <div className="relative ">
      <ProjectDetails id={projectId} />
    </div>
  );
}