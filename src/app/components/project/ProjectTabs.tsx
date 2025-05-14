"use client";
import { FiGrid, FiMessageCircle, FiPieChart } from "react-icons/fi";

interface ProjectTabsProps {
  activeTab: string;
  onTabChange: (tab: "kanban" | "chat" | "stats") => void;
}

export default function ProjectTabs({
  activeTab,
  onTabChange,
}: ProjectTabsProps) {
  const tabs = [
    {
      id: "kanban",
      label: "Kanban",
      icon: <FiGrid className="mr-2 h-5 w-5" />,
    },
    {
      id: "chat",
      label: "Chat",
      icon: <FiMessageCircle className="mr-2 h-5 w-5" />,
    },
    {
      id: "stats",
      label: "Estadísticas",
      icon: <FiPieChart className="mr-2 h-5 w-5" />,
    },
  ];

  return (
    <div className="border-b border-gray-300 mb-6">
      <nav className="flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as "kanban" | "chat" | "stats")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center 
              ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
