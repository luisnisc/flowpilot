"use client";
import { useEffect, useState } from 'react';
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface UserStatsWidgetProps {
  email: string;
}

export default function UserStatsWidget({ email }: UserStatsWidgetProps) {
  const [stats, setStats] = useState({
    completed: 0,
    total: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!email) return;
      
      try {
        const res = await fetch(`/api/stats/user?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            completed: data.completed,
            total: data.total,
            percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
          });
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [email]);

  const chartOptions = {
    chart: {
      height: 50,
      type: 'radialBar' as const,
      sparkline: {
        enabled: true
      },
    },
    colors: ['#10B981'],
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 0,
          size: '50%'
        },
        track: {
          margin: 0
        },
        dataLabels: {
          show: false
        }
      }
    },
    labels: ['Completadas']
  };

  if (loading) {
    return (
      <div className="flex justify-between items-center">
        <div className="h-3 w-16 bg-gray-600 animate-pulse rounded"></div>
        <div className="h-10 w-10 bg-gray-600 animate-pulse rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-xl font-bold text-white">{stats.completed}</span>
        <span className="text-xs text-gray-400">{stats.total} tareas</span>
      </div>
      <div style={{ width: '45px', height: '45px' }}>
        <Chart 
          options={chartOptions}
          series={[stats.percentage]}
          type="radialBar"
          width="45"
          height="45"
        />
      </div>
    </div>
  );
}