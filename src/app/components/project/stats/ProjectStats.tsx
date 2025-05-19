"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

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
  inProgress: number;
  inReview: number;
  comments: number;
  activity: number;
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
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "completed",
    "created",
  ]);

  const availableMetrics = [
    { id: "completed", name: "Tareas Completadas", color: "#10B981" },
    { id: "created", name: "Tareas Creadas", color: "#F59E0B" },
    { id: "inProgress", name: "En Progreso", color: "#3B82F6" },
    { id: "inReview", name: "En Revisión", color: "#8B5CF6" },
    { id: "activity", name: "Actividad Total", color: "#6D28D9" },
  ];

  useEffect(() => {
    const loadStatsData = async () => {
      setIsLoading(true);
      try {
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
          setTaskStats({
            pending: 1,
            in_progress: 1,
            review: 1,
            done: 1,
          });
        }

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
          setTaskTimeline(
            Array.from({ length: 14 }).map((_, i) => ({
              date: `05-${i + 1}`,
              created: Math.floor(Math.random() * 3),
              completed: Math.floor(Math.random() * 2),
              inProgress: Math.floor(Math.random() * 2),
              inReview: Math.floor(Math.random() * 1),
              comments: Math.floor(Math.random() * 2),
              activity: Math.floor(Math.random() * 5 + 2),
            }))
          );
        }
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
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
            inProgress: Math.floor(Math.random() * 2),
            inReview: Math.floor(Math.random() * 1),
            comments: Math.floor(Math.random() * 2),
            activity: Math.floor(Math.random() * 5 + 2),
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStatsData();
  }, [projectId]);

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(metricId)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== metricId);
      } else {
        return [...prev, metricId];
      }
    });
  };

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

  const timelineOptions = {
    chart: {
      height: 350,
      type: "line" as const,
      zoom: {
        enabled: true,
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
        },
      },
      fontFamily: "Inter, sans-serif",
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth" as const,
      width: Array(selectedMetrics.length).fill(3),
      dashArray: selectedMetrics.includes("activity")
        ? selectedMetrics.map((m) => (m === "activity" ? 5 : 0))
        : Array(selectedMetrics.length).fill(0),
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
      min: 0,
      max: 10,
      tickAmount: 5,
      forceNiceScale: false,
      labels: {
        formatter: (value: number) => Math.floor(value).toString(),
      },
    },
    legend: {
      position: "top" as const,
    },
    colors: selectedMetrics.map(
      (id) => availableMetrics.find((m) => m.id === id)?.color || "#000"
    ),
    tooltip: {
      shared: true,
      intersect: false,
    },
    markers: {
      size: 5,
      hover: {
        sizeOffset: 3,
      },
    },
    theme: {
      palette: "palette1",
    },
  };

  const timelineSeries = selectedMetrics.map((metricId) => {
    const metric = availableMetrics.find((m) => m.id === metricId);
    return {
      name: metric?.name || metricId,
      data: taskTimeline.map(
        (item) => item[metricId as keyof TimelineItem] as number
      ),
    };
  });

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
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Estado de Tareas</h3>
          <Chart
            options={taskStatusOptions}
            series={taskStatusSeries}
            type="donut"
            height={320}
          />
        </div>

        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Progreso General</h3>
          <Chart
            options={projectProgressOptions}
            series={projectProgressOptions.series}
            type="radialBar"
            height={320}
          />
        </div>

        <div className="bg-gray-100 p-4 rounded-lg shadow-sm md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Evolución Temporal</h3>
            <div className="flex flex-wrap gap-2">
              {availableMetrics.map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => handleMetricToggle(metric.id)}
                  className={`px-2 py-1 text-xs rounded-full transition-all ${
                    selectedMetrics.includes(metric.id)
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  <span className="flex items-center">
                    <span
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: metric.color }}
                    ></span>
                    {metric.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Chart
            options={timelineOptions}
            series={timelineSeries}
            type="line"
            height={350}
          />

          <div className="mt-4 bg-blue-50 p-3 rounded-lg text-sm text-blue-800 border border-blue-100">
            <p className="font-medium">💡 Consejo:</p>
            <p>
              Selecciona las métricas que quieres ver en el gráfico haciendo
              clic en los botones de arriba.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
