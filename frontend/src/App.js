import React, { useState, useEffect } from "react";
import { Table, Card, Row, Col, Button, Space, Tag, Select } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import moment from "moment";

const App = () => {
  //defining all the statehooks before using them
  const [demandData, setDemandData] = useState([]);
  const [productionData, setProductionData] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDemandDate, setSelectedDemandDate] = useState(null);
  const [selectedProductionDate, setSelectedProductionDate] = useState(null);
  const [filteredDemandData, setFilteredDemandData] = useState([]);
  const [chartSelectedDate, setChartSelectedDate] = useState(null);
  const [filteredChartData, setFilteredChartData] = useState([]);
  const [filteredProductionData, setFilteredProductionData] = useState([]);

  //this useEffect will fetch demand and production data again if the selectedDemandDate or selectedProductionDate changes
  useEffect(() => {
    fetchDemandData();
    fetchProductionData();
  }, [selectedDemandDate, selectedProductionDate]);

  //this function is to fetch the demandData from the backend demand api
  const fetchDemandData = async () => {
    try {
      //this checks if there is a selected demand date
      const formattedDemandDate = selectedDemandDate
        ? moment(selectedDemandDate).format("YYYY-MM-DD")
        : "";
      const url = `http://localhost:5037/api/elecDemand?date=${formattedDemandDate}`; //pass it into the url to fetch the data
      const response = await fetch(url); //wait until all the data is fetched
      if (response.ok) {
        const data = await response.json();
        //some data shows up as null so for it to show up as a value in the tables, it needs to be checked and modified before use.
        const modifiedData = data.map((item) => ({
          //retain the existin properties of item and add totalDemand to it
          ...item,
          totalDemand: item.demand || "0", // Set demand to '0' if it is null
        }));
        //sorting all of the modified data by their timestamps
        modifiedData.sort(
          (a, b) => moment(a.time).valueOf() - moment(b.time).valueOf()
        );
        //applying the filter based on the selectedDemandDate
        const filteredData = modifiedData.filter(
          (item) => item.date === selectedDemandDate
        );
        //the demandData is now updated with modifiedData and the filteredDemandDats is updated with the filteredData
        setDemandData(modifiedData); //this is for the general overall set of demandData sorted by time (and have the nulls be 0)
        setFilteredDemandData(filteredData); //this is for the data to be organized and filtered by date
      } else {
        console.error(response.status);
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  //similar logic and methods for productionData, except there are a few ore items to add to modified data as there is more details to production data
  const fetchProductionData = async () => {
    try {
      const formattedProductionDate = selectedProductionDate
        ? moment(selectedProductionDate).format("YYYY-MM-DD")
        : "";
      const url = `http://localhost:5037/api/elecProduction?date=${formattedProductionDate}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const modifiedData = data.map((item) => ({
          ...item,
          total: item.total || "0", // Set total production to '0' if it is null
          hydraulic: item.hydraulic || "0", // Set hydraulic production to '0' if it is null
          wind: item.wind || "0", // Set wind production to '0' if it is null
          solar: item.solar || "0", // Set solar production to '0' if it is null
          thermal: item.thermal || "0", // Set thermal production to '0' if it is null
          other: item.other || "0", // Set other production to '0' if it is null
        }));
        modifiedData.sort(
          (a, b) => moment(a.time).valueOf() - moment(b.time).valueOf()
        );
        const filteredData = selectedProductionDate
          ? modifiedData.filter((item) => item.date === selectedProductionDate)
          : modifiedData;
        setProductionData(modifiedData);
        setFilteredProductionData(filteredData);
      } else {
        console.error(response.status);
      }
    } catch (error) {
      console.error(error);
    }
  };

  //This function is to retrigger the data fetch if the refresh button is pressed
  //It also resets the chart selected date as the days available to choose from can be different with data updates
  const handleRefresh = async () => {
    await fetchDemandData();
    await fetchProductionData();
    setChartSelectedDate(selectedDemandDate);
  };

  //This function is to allow for a date filter to be applied in the tables
  const createFilterOptions = (data) => {
    const filterOptions = [];

    data.forEach((item) => {
      if (
        item.date &&
        !filterOptions.some((option) => option.value === item.date)
      ) {
        filterOptions.push({
          text: item.date,
          value: item.date,
        });
      }
    });

    return filterOptions;
  };

  //for chart data
  useEffect(() => {
    if (chartSelectedDate) {
      const filteredDemand = demandData.filter(
        (item) => item.date === chartSelectedDate
      );
      const filteredProduction = productionData.filter(
        (item) => item.date === chartSelectedDate
      );

      const demandChartData = filteredDemand.map((item) => ({
        time: item.time,
        demand: item.totalDemand,
      }));

      const productionChartData = filteredProduction.map((item) => ({
        time: item.time,
        total: item.total,
        hydraulic: item.hydraulic,
        wind: item.wind,
        solar: item.solar,
        thermal: item.thermal,
        other: item.other,
      }));

      setFilteredChartData(demandChartData);
      setFilteredProductionData(productionChartData);
    } else {
      setFilteredChartData([]);
      setFilteredProductionData([]);
    }
  }, [chartSelectedDate, demandData, productionData]);

  //These columns for demand, total production, and detailed production is to layout the order of the columns and includes the filter option for dates
  const demandColumns = [
    {
      title: "Date Filter",
      dataIndex: "date",
      key: "dateFilter",
      filters: createFilterOptions(demandData), // Create filter options based on demandData
      onFilter: (value, record) => record.date === value, // Filter demandData based on selected date
    },
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "Total Demand (kW)",
      dataIndex: "totalDemand",
      key: "demand",
      render: (text) => <Tag color="#d88484">{text}</Tag>,
      align: "center", // Align column title and values to center
    },
  ];
  const totalProductionColumns = [
    {
      title: "Date Filter",
      dataIndex: "date",
      key: "dateFilter",
      filters: createFilterOptions(productionData), // Create filter options based on productionData
      onFilter: (value, record) => record.date === value, // Filter productionData based on selected date
    },
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "Total Production (kW)",
      dataIndex: "total",
      key: "total",
      render: (text) => <Tag color="#84d888">{text}</Tag>,
      align: "center",  
    },
  ];
  const detailedProductionColumns = [
    {
      title: "Date Filter",
      dataIndex: "date",
      key: "dateFilter",
      filters: createFilterOptions(productionData), // Create filter options based on productionData
      onFilter: (value, record) => record.date === value, // Filter productionData based on selected date
    },
    {
      title: "Time",
      dataIndex: "time",
      key: "time", 
    },
    {
      title: "Hydraulic",
      dataIndex: "hydraulic",
      key: "hydraulic",
      render: (text) => <Tag color="#84abd8">{text}</Tag>,
      align: "center",  
    },
    {
      title: "Wind",
      dataIndex: "wind",
      key: "wind",
      render: (text) => <Tag color="#9984d8">{text}</Tag>,
      align: "center",  
    },
    {
      title: "Solar",
      dataIndex: "solar",
      key: "solar",
      render: (text) => <Tag color="#db724f">{text}</Tag>,
      align: "center",  
    },
    {
      title: "Thermal",
      dataIndex: "thermal",
      key: "thermal",
      render: (text) => <Tag color="#d45757">{text}</Tag>,
      align: "center",  
    },
    {
      title: "Other",
      dataIndex: "other",
      key: "other",
      render: (text) => <Tag color="#595959">{text}</Tag>,
      align: "center",  
    },
  ];

  //this allows for user to have a choice to view either detailed production data, or overview of the total production
  const productionColumns = showDetails
    ? detailedProductionColumns
    : totalProductionColumns;
  
  return (
    <div>
      {/*Header*/}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "0", marginTop: "0" }}
      >
        <h1>Hydro-Quebec Electrical Production and Demand Data</h1>
        <Space>
          <Button type="primary" onClick={handleRefresh}>
            Refresh Data
          </Button>
        </Space>
      </Row>
      {/*Demand and Production Tables*/}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={
              <Space>
                <span>Demand Data</span>
              </Space>
            }
          >
            {/* {slice the demandData by 1 since the first index is not necessary to display} */}
            <Table dataSource={demandData.slice(1)} columns={demandColumns} /> 
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={
              <Space>
                <span>Production Data</span>
                {/* {create a button for the user to click to show detailed or overview data} */}
                <Button onClick={() => setShowDetails(!showDetails)}>
                  {showDetails ? "Hide Details" : "Show Details"}
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={productionData.slice(1)}
              columns={productionColumns}
            />
          </Card>
        </Col>
      </Row>
      {/* Charts */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "0", marginTop: "16px" }}
      >
        <h2 style={{ marginBottom: "0" }}>Demand and Production Charts</h2>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* {creating a date selector for the charts} */}
          <span style={{ marginRight: "8px" }}>Select a Date:</span>
          <Select
            value={chartSelectedDate}
            onChange={(value) => setChartSelectedDate(value)}
            style={{ width: 200 }}
            placeholder="Select a date"
          >
            {createFilterOptions(demandData).map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.text}
              </Select.Option>
            ))}
          </Select>
        </div>
      </Row>
      <Row>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" />
            {/* {formatting the time on the x-axis to be slanted and in HH:mm format to be shorter} */}
            <XAxis
              dataKey="time"
              tickFormatter={(value) =>
                moment(value, "HH:mm:ss").format("HH:mm")
              }
              angle={-30}
              textAnchor="end"
            />
            <YAxis label={{
              value: "Electricity Produced (kW)",
              angle: -90,
              position: "insideLeft",
              dy: 75
            }}/>
            <Tooltip />
            <Legend verticalAlign="top" height={20} />
            <Line
              type="monotone"
              data={filteredChartData}
              dataKey="demand"
              name="Demand"
              stroke="#d88484"
            />
          </LineChart>
        </ResponsiveContainer>
      </Row>
      <Row>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart syncId="production">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              interval={0}
              tickFormatter={(value) =>
                moment(value, "HH:mm:ss").format("HH:mm")
              }
              angle={-30}
              textAnchor="end"
              padding={{ left: 30 }}
            />
            <YAxis label={{
              value: "Electricity Produced (kW)",
              angle: -90,
              position: "insideLeft",
              dy: 75
            }}/>
            <Tooltip />
            <Legend verticalAlign="top" height={20} />
            <Line
              type="monotone"
              data={filteredProductionData}
              dataKey="total"
              name="Production"
              stroke="#84d888"
            />
          </LineChart>
        </ResponsiveContainer>
      </Row>
      <Row>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={filteredProductionData} syncId="production">
            <XAxis
              dataKey="time"
              interval={0}
              tickFormatter={(value) =>
                moment(value, "HH:mm:ss").format("HH:mm")
              }
              angle={-30}
              textAnchor="end"
              padding={{ left: 30 }}
            />
            <YAxis label={{
              value: "Electricity Produced (kW)",
              angle: -90,
              position: "insideLeft",
              dy: 75
            }}/>
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend verticalAlign="top" height={20} />
            <Line
              type="monotone"
              dataKey="hydraulic"
              name="Hydraulic"
              stroke="#84abd8"
            />
            <Line 
              type="monotone" 
              dataKey="wind" 
              name="Wind" 
              stroke="#9984d8" 
            />
            <Line
              type="monotone"
              dataKey="solar"
              name="Solar"
              stroke="#db724f"
            />
            <Line
              type="monotone"
              dataKey="thermal"
              name="Thermal"
              stroke="#d45757"
            />
            <Line
              type="monotone"
              dataKey="other"
              name="Other"
              stroke="#595959"
            />
          </LineChart>
        </ResponsiveContainer>
      </Row>
    </div>
  );
};

export default App;
