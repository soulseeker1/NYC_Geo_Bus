import React from "react"
import Select from "react-select"
import Button from "react-bootstrap/Button"
import ButtonGroup from "react-bootstrap/ButtonGroup"
import Axios from "axios"
import Spinner from "react-bootstrap/Spinner"

const GeoClosedContent = ({ selectedOption, setSelectedOption, selectedLineOption, setSelectedLineOption, handleDropdownChange, handleDropdownLineChange, historyLine, historyVehRef, clearHistory, DeleteIcon, lineOptions, vehOptions, GeoByBus, setGeoByBus, geoByLatLong, isLoading, setIsLoading }) => {
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //This function will allow extract the start and end point of each feature then call function curveLatLongAPI,
  //After curveLatLongAPI, this function will then call cleanGeoByLatLong, which will combine all the results from
  //curveLatLongAPI to the appropriate geoJSON form and finally set the geoJSON to geoByBus, to display on leaflet
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async function switchLatLong() {
    console.log(GeoByBus)
    console.log(GeoByBus.features)
    GeoByBus.features.forEach(async (feature) => {
      let coordinates = feature.geometry.coordinates
      console.log(feature.geometry.type)
      if (feature.geometry.type !== "Point") {
        console.log("NOTE THIS IS A POINT!!!!!!!!!!!!")

        for (let i = 0; i < coordinates.length - 1; i++) {
          let startPt = coordinates[i]
          let endPt = coordinates[i + 1]
          console.log(startPt)
          console.log(endPt)
          await curveLatLongAPI(startPt, endPt) //This will send to the next function, where it will perform axios call
        }

        console.log(geoByLatLong)

        cleanGeoByLatLong(geoByLatLong)
      }
    })
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //This function will accept coordinates, startPt and endPt then perform axios call to get the curved geoJSON
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async function curveLatLongAPI(startPt, endPt) {
    console.log("INSIDE CURVELATLONG")
    console.log(startPt[0])
    //Creating the request body for the axios to send backend the coordinates
    const requestBody = {
      startPt: {
        long: startPt[0],
        lat: startPt[1],
      },
      endPt: {
        long: endPt[0],
        lat: endPt[1],
      },
    }
    console.log("sending")
    console.log("startPt:", startPt)
    //console.log("endPt:", endPt)
    console.log(requestBody)
    try {
      const response = await Axios.post("https://nyc-bus-routing-k3q4yvzczq-an.a.run.app/route", requestBody, {
        withCredentials: false,
      })
      // Obtain GeoJSON from backend and we will store the responses into variable geoByLatLong
      if (response.status === 200) {
        console.log(response.data)
        geoByLatLong.push(response.data)
        console.log("PUSHED")
        console.log(startPt[0])
        console.log(startPt[1])
        console.log(endPt[0])
        console.log(endPt[1])
        console.log(geoByLatLong)
      }
    } catch (error) {
      // If CORS error, retry the request
      if (error.response) {
        console.log("There was a problem with curveLatLongAPI")
        console.log(error)
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //This function will collect geoJSON from curvedLatLongAPI, concate and map them to allow visualization on leaflet
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async function cleanGeoByLatLong(uncleanedGeoJSON) {
    // Initialize an empty array to store all features
    let allFeatures = []

    // Loop through each GeoJSON object in geoByLatLong array
    uncleanedGeoJSON.forEach((geoJSON) => {
      const features = geoJSON.features
      // Combine the features to the allFeatures array
      allFeatures = allFeatures.concat(features)
    })

    // Create a new GeoJSON object with the combined features
    const mergedGeoJSON = {
      type: "FeatureCollection",
      features: allFeatures,
    }

    // Initialize an ID counter
    let idCounter = 0

    // Iterate over each feature in the features array
    mergedGeoJSON.features.forEach((feature) => {
      // Assign a unique ID to each feature
      feature.id = idCounter++
    })

    setGeoByBus(mergedGeoJSON)
    console.log(mergedGeoJSON)
  }
  return (
    <label>
      {isLoading === false ? (
        <div>
          <label>
            <h4>Select a Vehicle Reference:</h4>
            <Select value={selectedOption} onChange={handleDropdownChange} options={vehOptions} placeholder="Select or type..." />
            <Button variant="info" onClick={() => switchLatLong()}>
              <Spinner animation="border" />
            </Button>
            {historyVehRef.length > "0" && (
              <div>
                Past Searches:
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {historyVehRef.map((item, index) => (
                    <button id="history-button" key={index} onClick={() => setSelectedOption(item)}>
                      {item}
                    </button>
                  ))}
                  {historyVehRef.length > "0" && (
                    <button class="history-button" onClick={() => clearHistory("historyVehRef")}>
                      <DeleteIcon />
                    </button>
                  )}
                </div>
              </div>
            )}
          </label>
          <label>
            <h4>Select a Published Line:</h4>
            <Select value={lineOptions.find((opt) => opt.value === selectedLineOption)} onChange={handleDropdownLineChange} options={lineOptions} placeholder="Select or type..." />
            <div>
              <Button variant="info" onClick={() => switchLatLong()}>
                Actual Route
              </Button>
              {historyLine.length > "0" && (
                <div>
                  Past Searches:
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {historyLine.map((item, index) => (
                      <button id="history-button" key={index} onClick={() => setSelectedLineOption(item)}>
                        {item}
                      </button>
                    ))}
                    <button class="history-button" onClick={() => clearHistory("historyLine")}>
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <Spinner animation="border" />
        </div>
      )}
    </label>
  )
}

export default GeoClosedContent
