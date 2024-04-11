import { useState } from "react"
import Select from "react-select"
import Button from "react-bootstrap/Button"
import ButtonGroup from "react-bootstrap/ButtonGroup"
import Axios from "axios"
import Spinner from "react-bootstrap/Spinner"
import { styled } from "@mui/system"
import DeleteIcon from "@mui/icons-material/Delete"
import StraightIcon from "@mui/icons-material/Straight"
import RoundaboutRightIcon from "@mui/icons-material/RoundaboutRight"

const GeoClosedContent = ({ selectedOption, setSelectedOption, selectedLineOption, setSelectedLineOption, handleDropdownChange, handleDropdownLineChange, historyLine, historyVehRef, clearHistory, lineOptions, vehOptions, GeoByBus, setGeoByBus, geoByLatLong, setGeoByLatLong, isLoading, setIsLoading, actualGeoMode, setActualGeoMode, geoByStraightRoute, setGeoByStraightRoute, closestStart, setClosestStart, closestGoal, setClosestGoal, newSearch, setNewSearch }) => {
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //This function will check the whether geobyLatLong, is empty, if it is empty or it contains the geoJSON we need,
  //(scenario occurs if user toggle the same bus line published Line )it will attempt to call SwitchByLatLong, if not
  //it will just switch to the actual bus route stored
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const [geoArrayforClean, setGeoArrayForClean] = useState([])
  async function switchActualGeo() {
    if (actualGeoMode == true) {
      setGeoByBus(geoByStraightRoute)
      setActualGeoMode(false)
    }
    if (actualGeoMode == false && newSearch == true) {
      console.log("setting geoByStraightRoute")
      console.log(GeoByBus)
      setGeoByLatLong(null)
      setGeoByStraightRoute(GeoByBus) //Store into a variable first
      console.log(geoByStraightRoute)
      switchLatLong(GeoByBus)
      setActualGeoMode(true)
      setNewSearch(false)
      console.log("actualGeoMode " + actualGeoMode)
    }
    if (actualGeoMode == false && newSearch == false) {
      setGeoByBus(geoByLatLong)
      setActualGeoMode(true)
    }
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //This function will allow extract the start and end point of each feature then call function curveLatLongAPI,
  //After curveLatLongAPI, this function will then call cleanGeoByLatLong, which will combine all the results from
  //curveLatLongAPI to the appropriate geoJSON form and finally set the geoJSON to geoByBus, to display on leaflet
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async function switchLatLong(ChangeGeoJSON) {
    console.log(ChangeGeoJSON)
    console.log(ChangeGeoJSON.features)

    // Array to store all Axios promises
    const axiosPromises = []

    ChangeGeoJSON.features.forEach((feature) => {
      let coordinates = feature.geometry.coordinates
      console.log(feature.geometry.type)

      if (feature.geometry.type !== "Point") {
        console.log("NOTE THIS IS A POINT!!!!!!!!!!!!")

        for (let i = 0; i < coordinates.length - 1; i++) {
          let startPt = coordinates[i]
          let endPt = coordinates[i + 1]
          console.log(startPt)
          console.log(endPt)
          console.log("coordinates length " + coordinates.length)
          let coordinateFlag = "remove"
          if (i == 0) {
            coordinateFlag = "first"
          }
          if (i == coordinateFlag.length) {
            coordinateFlag = "last"
          }
          //   // Push the Axios promise to the array
          axiosPromises.push(curveLatLongAPI(startPt, endPt, coordinateFlag))
          //curveLatLongAPI(startPt, endPt)
        }

        console.log("onefeature done")
      }
    })

    try {
      // Wait for all Axios promises to resolve
      await Promise.all(axiosPromises)

      // After all Axios calls are completed, clean and set the geoByBus state
      //cleanGeoByLatLong(geoByLatLong)
    } catch (error) {
      console.error("Error occurred:", error)
    }
    await cleanGeoByLatLong(geoArrayforClean)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //This function will accept coordinates, startPt and endPt then perform axios call to get the curved geoJSON
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async function curveLatLongAPI(startPt, endPt) {
    console.log("INSIDE CURVELATLONG!!!!!!!!!!!!!!!!!!!!!!!")
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
    //Const for temporary array to push!!!
    try {
      const response = await Axios.post("https://nyc-bus-routing-k3q4yvzczq-an.a.run.app/route", requestBody, {
        withCredentials: false,
      })
      // Obtain GeoJSON from backend and we will store the responses into variable geoByLatLong
      if (response.status === 200 && response.data != "Wait") {
        console.log(response.data)
        //geoByLatLong.push(response.data)
        console.log("PUSHED")
        console.log(startPt[0])
        console.log(startPt[1])
        console.log(endPt[0])
        console.log(endPt[1])
        console.log("response.data: ")
        console.log(response.data)
        console.log(response.data.features)

        const filteredFeatures = response.data.features.filter((feature) => {
          if (feature.properties) return feature.properties["point type"] !== "closest start" && feature.properties["point type"] !== "closest goal"
        })
        console.log(filteredFeatures)
        geoArrayforClean.push(filteredFeatures)
      }
      if (response.status === 200 && response.data === "Wait") {
        //retry!!!!
        // Retry if response data is "Wait"
        if (retryCount < 30) {
          // Set MAX_RETRY to your desired maximum retry count
          const delay = 5000 // Set your desired delay in milliseconds
          console.log(`Retrying after ${delay / 1000} seconds...`)
          setTimeout(() => {
            curveLatLongAPI(startPt, endPt, retryCount + 1)
          }, delay)
        } else {
          console.log("Maximum retry count exceeded.")
        }
      }
    } catch (error) {
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
    console.log("INSIDE CLEANING !!!!!!!!!!!!!!!!!!!")
    // Initialize an empty array to store all features
    let allFeatures = []
    console.log("uncleanedGeoJSON ", uncleanedGeoJSON)
    // Loop through each GeoJSON object in geoByLatLong array
    uncleanedGeoJSON.forEach((geoJSON) => {
      //const features = geoJSON.features
      // Combine the features to the allFeatures array
      allFeatures = allFeatures.concat(geoJSON)
      console.log(geoJSON)
    })

    // Create a new GeoJSON object with the combined features
    const mergedGeoJSON = {
      type: "FeatureCollection",
      features: allFeatures,
    }

    // Initialize an ID counter
    let idCounter = 0

    console.log(mergedGeoJSON)

    // Iterate over each feature in the features array
    mergedGeoJSON.features.forEach((feature) => {
      // Assign a unique ID to each feature
      feature.id = idCounter++
    })
    console.log("mergedGeo JSON: " + mergedGeoJSON)
    setGeoByBus(mergedGeoJSON)
    setGeoByLatLong(mergedGeoJSON)
    console.log(mergedGeoJSON)
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //This function will filter through
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  }
  return (
    <label>
      {isLoading === false ? (
        <div>
          <label>
            <h5>Select a Vehicle Reference:</h5>
            <Select value={vehOptions.find((opt) => opt.value === selectedOption)} onChange={handleDropdownChange} options={vehOptions} placeholder="Select or type..." />
            {selectedOption != null && actualGeoMode === true && <StraightIcon style={{ backgroundColor: "#00e5ff", border: 1 }} onClick={() => switchActualGeo()} />}
            {selectedOption != null && actualGeoMode === false && <RoundaboutRightIcon style={{ backgroundColor: "#00e5ff", border: 1 }} onClick={() => switchActualGeo()} />}
            {historyVehRef.length > "0" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Past Searches:
                  {historyVehRef.length > "0" && (
                    // <button class="history-button" onClick={() => clearHistory("historyVehRef")}>
                    //   <DeleteIcon style={{ backgroundColor: "green" }} />
                    // </button>
                    <DeleteIcon style={{ backgroundColor: "transparent" }} onClick={() => clearHistory("historyVehRef")} />
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {historyVehRef.map((item, index) => (
                    <button id="history-button" key={index} onClick={() => setSelectedOption(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </label>
          <label>
            <div>
              <h5>Select a Published Line: </h5>
              <Select value={lineOptions.find((opt) => opt.value === selectedLineOption)} onChange={handleDropdownLineChange} options={lineOptions} placeholder="Select or type..." />
              {selectedLineOption != null && actualGeoMode === true && <StraightIcon style={{ backgroundColor: "#00e5ff", border: 1 }} onClick={() => switchActualGeo()} />}
              {selectedLineOption != null && actualGeoMode === false && <RoundaboutRightIcon style={{ backgroundColor: "#00e5ff", border: 1 }} onClick={() => switchActualGeo()} />}
              {historyLine.length > "0" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Past Searches:
                    <DeleteIcon style={{ backgroundColor: "transparent" }} onClick={() => clearHistory("historyLine")} />
                    <div />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {historyLine.map((item, index) => (
                      <button id="history-button" key={index} onClick={() => setSelectedLineOption(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>
      ) : (
        <label>
          <div class="text-center" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "3rem", height: "3rem" }}>
            <Spinner animation="border" />
          </div>
        </label>
      )}
    </label>
  )
}

export default GeoClosedContent
