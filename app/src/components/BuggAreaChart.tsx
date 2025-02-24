import { format } from "date-fns";
import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DetectedAudioSegment } from "../../types";

interface BuggAreaChartProps {
  primaryColour?: string;
  secondaryColour?: string;
  detections: DetectedAudioSegment[];
}

function BuggAreaChart(props: BuggAreaChartProps) {
  let data = useMemo(() => {
    // count by day
    let groups = props.detections.reduce((acc, curr) => {
      let day = format(curr.createdAt.toDate(), "M d");
      if (!(day in acc)) {
        acc[day] = {
          ordinal: day,
          day: format(curr.createdAt.toDate(), "do"),
          count: 0,
        };
      }
      acc[day].count = acc[day].count + 1;
      return acc;
    }, {} as { [day: string]: { ordinal: string; day: string; count: number } });

    return Object.keys(groups)
      .map((k) => groups[k])
      .sort((a, b) => a.ordinal.localeCompare(b.ordinal))
      .map((i) => ({ day: `${i.day}`, count: i.count }));
  }, [props.detections]);

  return (
    <View style={styles.BuggAreaChart}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          width={600}
          height={400}
          data={data}
          margin={{
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            style={{
              fontSize: "0.8rem",
              fontFamily: "Arial",
            }}
            mirror={true}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            style={{
              fontSize: "0.8rem",
              fontFamily: "Arial",
            }}
            mirror={true}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip labelStyle={{ fontFamily: "sans-serif" }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={props.primaryColour}
            fill={props.secondaryColour}
          />
        </AreaChart>
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  BuggAreaChart: {
    height: 170,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(BuggAreaChart);
