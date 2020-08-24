import React from "react";
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import * as firebase from "firebase";
import { AntDesign } from "@expo/vector-icons";
import LineChart from "react-native-chart-kit";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const chartConfigs = [
  {
    backgroundColor: "#ff3e03",
    backgroundGradientFrom: "#ff3e03",
    fillShadowGradientOpacity: 1,
    fillShadowGradient: "#E9446A",
    useShadowColorFromDataset: true,
    backgroundGradientTo: "#ff3e03",
    color: (opacity = 1) => `rgba(${0}, ${0}, ${0}, ${opacity})`,
  },
];

const graphStyle = {
  marginVertical: 8,
};
const data = {
  labels: ["January", "February", "March", "April", "May", "June"],
  datasets: [
    {
      data: [20, 45, 28, 80, 99, 43],
      color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
      strokeWidth: 2 // optional
    }
  ],
  legend: ["Rainy Days"] // optional
};

export default class StackedBarChartExample extends React.PureComponent {
  render() {
    return (
      <LineChart
        data={data}
        width={windowWidth}
        height={256}
        verticalLabelRotation={30}
        chartConfig={chartConfigs[0]}
        bezier
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginTop: 5,
  },
});
