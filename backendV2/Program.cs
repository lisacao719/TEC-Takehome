//The purpose of this file is to pull the data from the json links, reformat it, then send it to frontend as api
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace DataRetrieval
{
    public class DemandAndProductionDataRetrieval
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            // Add CORS policy so that only the frontend can access the data pulled from backend 
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(builder =>
                {
                    builder.WithOrigins("http://localhost:3000")
                           .AllowAnyMethod()
                           .AllowAnyHeader();
                });
            });
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddHttpClient();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            app.UseCors();
            app.UseHttpsRedirection();
            app.UseAuthorization();
            app.MapControllers();

            //FetchDataFromURL - asynchronous function to perform the get request from the specified url
            //and returns the content as a string if successful
            async Task<string> FetchDataFromUrl(HttpClient client, string url)
            {
                HttpResponseMessage response = await client.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadAsStringAsync();
                }
                else
                {
                    throw new Exception($"Failed to retrieve data. Status code: {response.StatusCode}");
                }
            }

            //The purpose of using JArray (JSON array) is allowing for the usage of Newtonsoft.Json where we can now modify/remove things from the json as if was a regular array
            //Flatten the demand data and creates new JObjects (JSON Objects) for each data item
            //These objects are then placed back into a singular array where it can accessed easily in the frontend
            static JArray FlattenDemandData(string jsonData)
            {
                var flattenedDemandData = new JArray();
                var demandData = JObject.Parse(jsonData);

                //This is to take the data that isn't nested
                var details = demandData["details"];
                var metadata = new JObject();
                metadata["dateStart"] = demandData.Value<string>("dateStart");
                metadata["dateEnd"] = demandData.Value<string>("dateEnd");
                metadata["recentHour"] = demandData.Value<string>("recentHour");
                metadata["indexDonneePlusRecent"] = demandData.Value<int>("indexDonneePlusRecent");
                metadata["nbDateAvecData"] = demandData.Value<int>("nbDateAvecData");
                flattenedDemandData.Add(metadata); //add to flattenedDemandData array

                //This loop accesses the all of the information nested within [details] level
                foreach (JObject item in details.Children<JObject>())
                {
                    //Finds the date and timestamp, as well as the demandeTotal for each Timestammp
                    var dateTime = item.Value<string>("date");
                    var demandTotal = item["valeurs"]?["demandeTotal"]?.Value<string>();

                    if (!string.IsNullOrEmpty(dateTime) && !string.IsNullOrEmpty(demandTotal))
                    {
                        //this is to parse the date time to be separated date, and time, and add them to the flattened array along with the total demand value
                        var parsedDateTime = DateTime.ParseExact(dateTime, "MM/dd/yyyy HH:mm:ss", CultureInfo.InvariantCulture);
                        var flattenedItem = new JObject();
                        flattenedItem["date"] = parsedDateTime.ToString("MM/dd/yyyy");
                        flattenedItem["time"] = parsedDateTime.ToString("HH:mm:ss");
                        flattenedItem["demand"] = demandTotal;
                        flattenedDemandData.Add(flattenedItem);
                    }
                }
                return flattenedDemandData;
            }

            //flattening the production data is similar to demand data except production has a few more items in the nested data level
            //flatten the production data
            static JArray FlattenProductionData(string jsonData)
            {
                var flattenedProductionData = new JArray();
                var productionData = JObject.Parse(jsonData);

                //This is to take the data that isn't nested
                var details = productionData["details"];
                var metadata = new JObject();
                metadata["dateStart"] = productionData.Value<string>("dateStart");
                metadata["dateEnd"] = productionData.Value<string>("dateEnd");
                metadata["recentHour"] = productionData.Value<string>("recentHour");
                metadata["indexDonneePlusRecent"] = productionData.Value<int>("indexDonneePlusRecent");
                metadata["nbDateAvecData"] = productionData.Value<int>("nbDateAvecData");
                flattenedProductionData.Add(metadata);

                //This loop accesses the all of the information nested within [details] level
                foreach (JObject item in details.Children<JObject>())
                {
                    //getting all production data breakdown
                    var dateTime = item.Value<string>("date");
                    var productionTotal = item["valeurs"]?["total"]?.Value<string>();
                    var productionHydraulic = item["valeurs"]?["hydraulique"]?.Value<string>();
                    var productionWind = item["valeurs"]?["eolien"]?.Value<string>();
                    var productionOther = item["valeurs"]?["autres"]?.Value<string>();
                    var productionSolar = item["valeurs"]?["solaire"]?.Value<string>();
                    var productionThermal = item["valeurs"]?["thermique"]?.Value<string>();

                    if (!string.IsNullOrEmpty(dateTime) && !string.IsNullOrEmpty(productionTotal))
                    {
                        //parse the date time to be separated date, and time, and add them to the flattened array along with the other production value
                        var parsedDateTime = DateTime.ParseExact(dateTime, "MM/dd/yyyy HH:mm:ss", CultureInfo.InvariantCulture);
                        var flattenedItem = new JObject();
                        flattenedItem["date"] = parsedDateTime.ToString("MM/dd/yyyy");
                        flattenedItem["time"] = parsedDateTime.ToString("HH:mm:ss");
                        flattenedItem["total"] = productionTotal;
                        flattenedItem["hydraulic"] = productionHydraulic;
                        flattenedItem["wind"] = productionWind;
                        flattenedItem["other"] = productionOther;
                        flattenedItem["solar"] = productionSolar;
                        flattenedItem["thermal"] = productionThermal;
                        flattenedProductionData.Add(flattenedItem);
                    }
                }
                return flattenedProductionData;
            }

            //defining the end points "/api/demand" and "/api/production" and triggering function to fetch data and returning those values
            //these 2 endpoint handlers are request handlers for the api endpoints and define the logic to retreive the necessary data when there is a request
            app.MapGet("/api/elecDemand", async (HttpContext httpContext) =>
            {
                try
                {
                    string demandUrl = "https://www.hydroquebec.com/data/documents-donnees/donnees-ouvertes/json/demande.json";
                    HttpClient httpClient = httpContext.RequestServices.GetRequiredService<HttpClient>();
                    string demandData = await FetchDataFromUrl(httpClient, demandUrl); //getting the string content
                    JArray flattenedDemandData = FlattenDemandData(demandData); //passing string content through to flatten the demand data 
                    return flattenedDemandData.ToString();//returning Jarray as a string 
                }
                catch (Exception ex) //catching any errors when trying to retreive the demand data
                {
                    string message = $"Failed to retrieve demand data: {ex.Message}";
                    return message;
                }
            });

            app.MapGet("/api/elecProduction", async (HttpContext httpContext) =>
            {
                try
                {
                    string productionUrl = "https://www.hydroquebec.com/data/documents-donnees/donnees-ouvertes/json/production.json";
                    HttpClient httpClient = httpContext.RequestServices.GetRequiredService<HttpClient>();
                    string productionData = await FetchDataFromUrl(httpClient, productionUrl);
                    JArray flattenedProductionData = FlattenProductionData(productionData);
                    return flattenedProductionData.ToString();
                }
                catch (Exception ex)
                {
                    string message = $"Failed to retrieve production data: {ex.Message}";
                    return message;
                }
            });
            await app.RunAsync();
        }
    }
}