import React from "react";

interface DashboardCardProps {
  title: string;
  value: number;
  color?: string; // ex: "bg-blue-100"
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, color }) => {
  return (
    <div
      className={`
        flex flex-col justify-center mx-3 text-black
        rounded-3xl p-4 shadow-lg box-border w-40 h-40
        ${color ?? "bg-white"} 
        transition-transform duration-300 hover:scale-105
      `}
    >
      <h3 className=" font-medium text-[#023472] text-center uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-4xl font-extrabold text-[#023472] text-center">
        {value}
      </p>
    </div>
  );
};

export default DashboardCard;
