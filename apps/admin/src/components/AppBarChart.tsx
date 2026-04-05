'use client';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
  desktop: {
    label: 'Total',
    color: 'var(--chart-1)',
  },
  mobile: {
    label: 'Successfull',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

const chartData = [
  { month: 'January', total: 186, succesfull: 80 },
  { month: 'February', total: 305, succesfull: 200 },
  { month: 'March', total: 237, succesfull: 120 },
  { month: 'April', total: 173, succesfull: 90 },
  { month: 'May', total: 209, succesfull: 130 },
  { month: 'June', total: 214, succesfull: 140 },
];

const AppBarChart = () => {
  return (
    <div className="">
      <h1 className="mb-6 text-lg font-medium">Total Revenue</h1>
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis tickLine={false} tickMargin={10} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="total" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="succesfull" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default AppBarChart;
