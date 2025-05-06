"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import ProjectDetails from "@/app/components/ProjectDetails";

interface ProjectDetailParams {
  id: string;
}

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();
  const projectId = params?.id as string;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (!projectId) {
      router.push("/projects");
    }
  }, [status, projectId, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {projectId && <ProjectDetails id={projectId} />}
    </div>
  );
}
