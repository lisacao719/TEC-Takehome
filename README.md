### Introduction

This is my submission for the take home project provided by TEC Energy for the Full Stack Developer role.
This web app uses C# in the backend and React.JS in the frontend and was built using Windows.

##### Prerequisites

To run this project locally, ensure you have the following installed:

.NET 5 SDK

##### Package Installations

For the backend, a couple of package installs are required. Navigate to the root of the project before installation

1. `dotnet add package System.Net.Http`
2. `dotnet add package Newtonsoft.Json`

More details can be found here: 
https://learn.microsoft.com/en-us/nuget/quickstart/install-and-use-a-package-in-visual-studio


For the frontend, Ant Design (antd), Rechart, and moment elements are used to render the data. This requires going to the root directory of the project in the terminal and running:

1. `npm install antd` or `yarn add antd`
2. `npm install recharts` or `yarn add recharts`
3. `npm install moment` or `yarn add moment`

##### Start-Up Instructions

1. Ensure that your frontend goes to localhost:3000 or change it to whatever you have in the CORS policy in Program.cs file
2. Navigate to backend folder (named backendV2) and run `dotnet build` to compile the code, then `dotnet run` to start the backend server
3. In a separate terminal, navigate to the frontend folder(named frontend) and run `npm start` 
4. A page should pop up in your browser containing all of the information (2 Tables and 3 Charts)

##### About this project

This project was assigned to me by the dev team at TEC Energy as part of the interview process for the fullstack developer position. 
The goal of this project is to create a web app (front and backend) which can be used to visualize data sourced from a REST API.
For the data visualization aspect, it is required to be rendered out in both grid and chart view.

###### Backend Logic

To start this project, a backend was built using C# to retreive and format the data in a way the frontend can use easily. This also required a CORS policy to be added to ensure that only the frontend can fetch and access the data provided through the APIs. The backend contains a few functions, FetchDataFromUrl, FlattenDemandData, and FlattenProductionData. The purpose of the first function is to ensure that the data is fetchable from the urls provided and will return the data as a string format. 

The next 2 functions is to flatten the data; the raw data contains many layers and in order for the components in the frontend to view and use this data easily, it needs to be flattened into a singular level before being passed on. The reason the flattening of the data is split into 2 functions is because the layout of how to data and objects were nested for demand vs production was different. They do, however, acheive the same goal. 
Next, is to define the API endpoints. This is to simply supply the URLs and define the logic for which it will retreive the data, which the frontend will access. In this case, it will fetch the data from the url, flatten it, and then return it as a string. 

###### Frontend Logic

Next is the frontend; A few functions are written to pull the demand and production data from the APIs defined in the backend. It then essentially stores all of these data objects into statehooks. These functions also allow for it to pull specific data by date, which is added into the URL when fetching data from the APIs. 
Everytime the selected demand or production date changes, the data is fetched again and set into the demand/production data and filtered demand/production data. Moreover, in these functions, if the data shows up as null from the backend (simply because there is no information at those dates or timestamps) it will be modified to show as 0 in the tables. Also, if the original demand and production data changes, the useEffect function pertaining to the chart data also reflect this. This useEffect function also takes into account the filtering of the dates. 

A function to refresh the data is also added and will be used as part of a button to allow the user to refresh the data there instead of reloading the page.
The column/table structure is defined in demandColumns, totalProductionColumns, and detailedProductionColumns. This is to define the layout of the tables when rendered. Another button is added to the production table where the user can choose to view the overview and detailed production data.

The layout of the web app should be first the header on the left and the Refresh button on the right, followed by 2 tables side by side underneath the header. In the production table (on the right), there should be a Show Details button next to the table title. 
Underneath the tables should be a header stating the demand and production charts on the left, and a date selector on the right. Right underneath it should be 3 charts (1. Demand Chart, 2. Total Production Chart, and 3. Detailed Production Chart). When hovering over the data points in the charts, there should be a popup showing the data point values. Moreover, the last 2 charts are synced, meaning as the cursor goes across one of the charts, a popup will appear for the other synced chart showing both the total and detailed production data points. 
