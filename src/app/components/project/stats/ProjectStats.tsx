"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Importación dinámica para evitar problemas de SSR
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface TaskStats {
  pending: number;
  in_progress: number;
  review: number;
  done: number;
}

interface TimelineItem {
  date: string;
  completed: number;
  created: number;
}

interface ProjectStatsProps {
  projectId: string;
}

export default function ProjectStats({ projectId }: ProjectStatsProps) {
  const [taskStats, setTaskStats] = useState<TaskStats>({
    pending: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  });

  const [taskTimeline, setTaskTimeline] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStatsData = async () => {
      setIsLoading(true);
      try {
        // Obtener estadísticas de tareas
        const tasksResponse = await fetch(
          `/api/stats/tasks?projectId=${projectId}`
        );
        if (tasksResponse.ok) {
          const data = await tasksResponse.json();
          setTaskStats(data.taskStats);
        } else {
          console.error(
            "Error cargando estadísticas de tareas:",
            await tasksResponse.text()
          );
          // Establecer datos predeterminados en caso de error
          setTaskStats({
            pending: 1,
            in_progress: 1,
            review: 1,
            done: 1,
          });
        }

        // Obtener datos de timeline
        const timelineResponse = await fetch(
          `/api/stats/timeline?projectId=${projectId}`
        );
        if (timelineResponse.ok) {
          const data = await timelineResponse.json();
          setTaskTimeline(data.timeline);
        } else {
          console.error(
            "Error cargando timeline:",
            await timelineResponse.text()
          );
          // Establecer datos predeterminados en caso de error
          setTaskTimeline(
            Array.from({ length: 14 }).map((_, i) => ({
              date: `05-${i + 1}`,
              created: Math.floor(Math.random() * 3),
              completed: Math.floor(Math.random() * 2),
            }))
          );
        }
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
        // Establecer datos predeterminados
        setTaskStats({
          pending: 1,
          in_progress: 1,
          review: 1,
          done: 1,
        });
        setTaskTimeline(
          Array.from({ length: 14 }).map((_, i) => ({
            date: `05-${i + 1}`,
            created: Math.floor(Math.random() * 3),
            completed: Math.floor(Math.random() * 2),
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStatsData();
  }, [projectId]);

  // Opciones para el gráfico circular de estado de tareas
  const taskStatusOptions = {
    chart: {
      type: "donut" as const,
      fontFamily: "Inter, sans-serif",
    },
    labels: ["Pendientes", "En Progreso", "En Revisión", "Completadas"],
    colors: ["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981"],
    legend: {
      position: "bottom" as const,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: "bottom" as const,
          },
        },
      },
    ],
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0
                );
              },
            },
          },
        },
      },
    },
  };

  const taskStatusSeries = [
    taskStats.pending,
    taskStats.in_progress,
    taskStats.review,
    taskStats.done,
  ];

  // Opciones para el gráfico de línea de tareas a lo largo del tiempo
  const timelineOptions = {
    chart: {
      height: 350,
      type: "line" as const,
      zoom: {
        enabled: true,
      },
      fontFamily: "Inter, sans-serif",
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth" as const,
      width: [3, 3],
    },
    title: {
      text: "Evolución de Tareas",
      align: "center" as const,
    },
    grid: {
      row: {
        colors: ["#f3f3f3", "transparent"],
        opacity: 0.5,
      },
    },
    xaxis: {
      categories: taskTimeline.map((item) => item.date),
      labels: {
        rotate: -45,
        rotateAlways: false,
      },
    },
    yaxis: {
      title: {
        text: "Número de Tareas",
      },
    },
    legend: {
      position: "top" as const,
    },
    colors: ["#3B82F6", "#F59E0B"],
  };

  const timelineSeries = [
    {
      name: "Tareas Completadas",
      data: taskTimeline.map((item) => item.completed),
    },
    {
      name: "Tareas Creadas",
      data: taskTimeline.map((item) => item.created),
    },
  ];

  // Gráfico de progreso del proyecto (medidor)
  const totalTasks =
    taskStats.pending +
    taskStats.in_progress +
    taskStats.review +
    taskStats.done;
  const progressPercentage =
    totalTasks > 0 ? Math.round((taskStats.done / totalTasks) * 100) : 0;

  const projectProgressOptions = {
    chart: {
      height: 280,
      type: "radialBar" as const,
      fontFamily: "Inter, sans-serif",
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: "70%",
        },
        track: {
          background: "#e7e7e7",
          strokeWidth: "97%",
          margin: 5,
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            color: "#999",
            opacity: 1,
            blur: 2,
          },
        },
        dataLabels: {
          name: {
            fontSize: "16px",
            color: "#333",
            offsetY: 120,
          },
          value: {
            offsetY: 76,
            fontSize: "22px",
            color: undefined,
            formatter: function (val: number) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        shadeIntensity: 0.15,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 65, 91],
      },
    },
    stroke: {
      dashArray: 4,
    },
    series: [progressPercentage],
    labels: ["Progreso del Proyecto"],
    colors: ["#10B981"],
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded md:col-span-2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-6">Estadísticas del Proyecto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico circular de estado de tareas */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Estado de Tareas</h3>
          <Chart
            options={taskStatusOptions}
            series={taskStatusSeries}
            type="donut"
            height={320}
          />
        </div>

        {/* Gráfico de progreso del proyecto */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Progreso General</h3>
          <Chart
            options={projectProgressOptions}
            series={projectProgressOptions.series}
            type="radialBar"
            height={320}
          />
        </div>

        {/* Gráfico de línea de tareas a lo largo del tiempo */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Evolución Temporal</h3>
          <Chart
            options={timelineOptions}
            series={timelineSeries}
            type="line"
            height={350}
          />
        </div>
      </div>
    </div>
  );
}
