import { useState, useEffect, useRef } from "react"
import Axios from "axios"
import "./App.css"
import Select from "react-select"
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet"
import "leaflet/dist/leaflet.css" // Import Leaflet CSS
import "bootstrap/dist/css/bootstrap.min.css"
import Button from "react-bootstrap/Button"
import ButtonGroup from "react-bootstrap/ButtonGroup"
import DeleteIcon from "@mui/icons-material/Delete"
import Alert from "@mui/material/Alert"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import GeoOpenContent from "./GeoOpenContent.jsx"
import GeoClosedContent from "./GeoClosedContent.jsx"
import LatLongMode from "./LatLongMode.jsx"
import AxisMode from "./AxisMode.jsx"

function App() {
  const [selectedOption, setSelectedOption] = useState("")
  const [backendStatus, setBackendStatus] = useState("Checking...")
  const [vehref, setVehRef] = useState([])
  const [selectedLineOption, setSelectedLineOption] = useState("")
  const [lineref, setLineRef] = useState([])
  const [GeoByBus, setGeoByBus] = useState([])

  const [center, setCenter] = useState([40.612948, -73.925787])
  // Controls the side bar
  const [navOpen, setNavOpen] = useState(false)
  //needed to move map
  const mapRef = useRef(null) // Add this line to create the mapRef

  //const [trueBounds, setTrueBounds] = useState()
  //For the mouse clicking on the map to show feature details
  const [selectedFeature, setSelectedFeature] = useState(null) // used to see which place the user has selected

  // Controls the geo information toggle button
  const [sideBarMode, setSideBarMode] = useState("Bus")

  //For saving history of ref and line
  const [historyVehRef, setHistoryVehRef] = useState(JSON.parse(localStorage.getItem("historyVehRef")) || [])
  const [historyLine, setHistoryLine] = useState(JSON.parse(localStorage.getItem("historyLine")) || [])

  //For toggling full screen mode
  const [fullScreenMode, setFullScreenMode] = useState(false)

  //For alert messages
  const [ToastMessage, setToastMessage] = useState()

  const handleDropdownChange = (event) => {
    //console.log(event.value)
    setSelectedOption(event.value)
  }

  const handleDropdownLineChange = (event) => {
    setSelectedLineOption(event.value)
  }

  const checkServer = async () => {
    try {
      const response = await Axios.get("https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/ready", {
        withCredentials: false,
      })

      if (response.status === 200) {
        if (response.data.status === "Ready") {
          setBackendStatus("Backend is ready!")
          setNavOpen(true)
          fetchBus(), fetchLine()
        } else if (response.data.status === "Wait") {
          setBackendStatus("Backend is not ready.")
          // Retry after 20 seconds
          setTimeout(checkServer, 10000)
        }
      }
    } catch (error) {
      console.error("There was a problem checking the backend status:", error)
      setBackendStatus("Error checking backend status")
      // Retry after 20 seconds
      setTimeout(checkServer, 20000)
    }
  }

  useEffect(() => {
    // Initial check
    checkServer(), fetchBus(), fetchLine()
  }, [])

  useEffect(() => {
    // Initial check
    console.log(selectedFeature)
  }, [selectedFeature])

  // Fetch bus groups from the backend
  const fetchBus = async () => {
    try {
      const response = await Axios.get("https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getVehRef", {
        withCredentials: false,
      })
      // Check the response from the server and set the message accordingly
      if (response.status === 200) {
        setVehRef(response.data.sort())
      }
    } catch (e) {
      //console.log(selectedGroup) // Note: This is just for reference, you can remove it
      console.log("There was a problem from Group Fetch")
      console.log(e)
    }
  }

  // Fetch bus groups from the backend
  const fetchLine = async () => {
    try {
      const response = await Axios.get("https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getPubLineName", {
        withCredentials: false,
      })
      // Check the response from the server and set the message accordingly
      if (response.status === 200) {
        setLineRef(response.data.sort())
      }
    } catch (e) {
      //console.log(selectedGroup) // Note: This is just for reference, you can remove it
      console.log("There was a problem from reference line Fetch")
      console.log(e)
    }
  }

  // Fetch geo details using bus
  useEffect(() => {
    const fetchGeoByVehRef = async () => {
      if (selectedOption !== null) {
        let axiosQuote = "https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getBusTripByVehRef/"
        axiosQuote = axiosQuote + selectedOption
        try {
          const response = await Axios.get(axiosQuote, {
            withCredentials: false,
          })
          // Check the response from the server and set the message accordingly
          if (response.status === 200) {
            setSelectedLineOption(null)
            console.log(response.data.type)
            if (response.data.type === "FeatureCollection") {
              const geoJsonWithIds = {
                ...response.data,
                features: response.data.features.map((feature, index) => ({
                  ...feature,
                  id: index, // Put a new index for select colour
                })),
              }
              setGeoByBus(geoJsonWithIds)
            } else {
              setGeoByBus(response.data)
            }

            // Use the getBounds() method to get the bounds of the GeoJSON layer
            const geoJSONLayer = L.geoJSON(response.data)
            const truebounds = geoJSONLayer.getBounds()

            mapRef.current.flyToBounds(truebounds)
            setSideBarMode("Info")
            //Call function to record history
            recordHistory("historyVehRef", historyVehRef, selectedOption)
            console.log(historyVehRef)
            //Toasify to show display
            toast.success("Displaying Vehicle Reference: " + selectedOption)
          }
        } catch (e) {
          //console.log(selectedGroup) // Note: This is just for reference, you can remove it
          console.log("There was a problem from Geo By Bus")
          console.log(e)
        }
      }
    }
    fetchGeoByVehRef()
  }, [selectedOption])

  // Fetch geo details using bus
  useEffect(() => {
    const fetchGeoByLine = async () => {
      if (selectedLineOption !== null) {
        let axiosQuote = "https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getBusTripByPubLineName/"
        axiosQuote = axiosQuote + selectedLineOption
        try {
          const response = await Axios.get(axiosQuote, {
            withCredentials: false,
          })
          // Check the response from the server and set the message accordingly
          if (response.status === 200) {
            console.log(response.data)
            setSelectedOption(null)
            //setGeoByBus(response.data)
            if (response.data.type === "FeatureCollection") {
              const geoJsonWithIds = {
                ...response.data,
                features: response.data.features.map((feature, index) => ({
                  ...feature,
                  id: index, // Put a new index for select colour
                })),
              }
              console.log(response.data)
              console.log(geoJsonWithIds)
              setGeoByBus(geoJsonWithIds)
            } else {
              setGeoByBus(response.data)
            }

            // Use the getBounds() method to get the bounds of the GeoJSON layer
            const geoJSONLayer = L.geoJSON(response.data)
            const truebounds = geoJSONLayer.getBounds()

            // Fit the map to the new bounds
            console.log(truebounds)

            //Set the side bar to show info
            setSideBarMode("Info")
            //make map go there
            mapRef.current.flyToBounds(truebounds)
            //Call function to record
            recordHistory("historyLine", historyLine, selectedLineOption)
            console.log(historyLine)
            toast.success("Displaying Published Line: " + selectedLineOption)
          }
        } catch (e) {
          //console.log(selectedGroup) // Note: This is just for reference, you can remove it
          console.log("There was a problem from Geo By veh ref")
          console.log(e)
        }
      }
    }
    fetchGeoByLine()
  }, [selectedLineOption])

  /* Set the width of the side navigation to 250px */
  async function openNav() {
    if (backendStatus === "Backend is ready!") {
      setNavOpen(true)
    }
  }

  async function closeNav() {
    setNavOpen(false)
  }

  //Allows toggling of the sidebar content to show whether geo info or selection
  async function toggleMode(mode) {
    //if (event.target.classList.contains("togglebtn")) {
    setSideBarMode(mode)
    //setSelectedFeature(null)
    console.log("toggling to " + mode)
    //}
  }

  // Assume you have arrays 'vehref' and 'lineref' with your options
  const vehOptions = vehref.map((reference) => ({ value: reference, label: reference }))
  const lineOptions = lineref.map((reference) => ({ value: reference, label: reference }))

  /* Moves the header and the sidenav out to expand map */
  async function fullScreen() {
    // if (navOpen === true) {
    //   setNavOpen(false)
    // }

    if (fullScreenMode === true) {
      setFullScreenMode(false)
    }
    if (fullScreenMode === false) {
      setFullScreenMode(true)
      if (navOpen === true) {
        setNavOpen(false)
      }
    }
  }

  //Record History in state AND local storage
  async function recordHistory(storageArrayName, historyArray, selection) {
    if (historyArray.includes(selection)) {
      historyArray.splice(historyArray.indexOf(selection), 1)
      console.log("splicing")
    }
    historyArray.unshift(selection)
    console.log(historyArray)
    if (historyArray.length > 5) {
      historyArray.pop()
      console.log(historyArray)
      console.log("shifting")
    }
    localStorage.setItem(storageArrayName, JSON.stringify(historyArray))
    //currently thinking how to store name?
  }
  //Clear History
  async function clearHistory(target) {
    if (target === "historyLine") {
      if (localStorage.getItem("historyLine") === null) {
        toast.error("Published Line history is empty!")
      }

      if (localStorage.getItem("historyLine") !== null) {
        setHistoryLine([])
        localStorage.removeItem("historyLine")
        if (localStorage.getItem("historyLine") === null) {
          toast.success("Published Line history cleared")
        }
      }
    }
    if (target === "historyVehRef") {
      if (localStorage.getItem("historyVehRef") === null) {
        toast.error("Vehicle Reference history is empty!")
      }

      if (localStorage.getItem("historyVehRef") !== null) {
        setHistoryVehRef([])
        localStorage.removeItem("historyVehRef")
        if (localStorage.getItem("historyVehRef") === null) {
          toast.success("Vehicle Reference history cleared")
        }
      }
    }
    console.log(historyLine)
  }

  return (
    <>
      <div className={fullScreenMode ? "header-close" : "header"} style={{ height: fullScreenMode ? "0vh" : "10vh", overflowX: "auto" }}>
        <button class="openbtn" onClick={openNav} style={{ backgroundColor: backendStatus === "Backend is ready!" ? "green" : "red" }}>
          &#9776; {backendStatus === "Backend is ready!" ? "" : "Server not ready"}
        </button>
        <div id="header-title">
          <h2>Geo Bus</h2>
        </div>
      </div>
      <div>
        <ToastContainer />
      </div>
      <div id="mySidenav" className={navOpen ? "sidenav-open" : "sidenav-close"} style={{ width: navOpen ? "60vh" : 0, height: "100%", overflowY: "auto" }}>
        <a href="#" class="closebtn" onClick={closeNav}>
          &times;
        </a>
        <ButtonGroup aria-label="Basic example">
          <Button variant="primary" onClick={() => toggleMode("Bus")} active={sideBarMode === "Bus"}>
            Bus
          </Button>
          <Button variant="secondary" onClick={() => toggleMode("LatLong")} active={sideBarMode === "LatLong"}>
            LatLong
          </Button>
          <Button variant="info" onClick={() => toggleMode("Axis")} active={sideBarMode === "Axis"}>
            Axis
          </Button>
          <Button variant="info" onClick={() => toggleMode("Info")} active={sideBarMode === "Info"}>
            Info
          </Button>
        </ButtonGroup>

        {sideBarMode === "Bus" && <GeoClosedContent selectedOption={selectedOption} setSelectedOption={setSelectedOption} selectedLineOption={selectedLineOption} setSelectedLineOption={setSelectedLineOption} handleDropdownChange={handleDropdownChange} handleDropdownLineChange={handleDropdownLineChange} vehOptions={vehOptions} lineOptions={lineOptions} historyLine={historyLine} historyVehRef={historyVehRef} clearHistory={clearHistory} DeleteIcon={DeleteIcon} />}

        {sideBarMode === "LatLong" && <LatLongMode></LatLongMode>}

        {sideBarMode === "Axis" && <AxisMode></AxisMode>}

        {sideBarMode === "Info" && <GeoOpenContent selectedOption={selectedOption} setSelectedOption={setSelectedOption} selectedLineOption={selectedLineOption} setSelectedLineOption={setSelectedLineOption} handleDropdownLineChange={handleDropdownLineChange} lineOptions={lineOptions} vehOptions={vehOptions} historyLine={historyLine} clearHistory={clearHistory} DeleteIcon={DeleteIcon} selectedFeature={selectedFeature} toggleMode={toggleMode} />}

        {sideBarMode === "Info" && selectedFeature && (
          <label>
            <div>
              <h2>Selected Feature: {selectedOption || selectedLineOption}</h2>
              <table style={{ width: "100%", height: "100%", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th style={{ width: "50%" }}>Property</th>
                    <th style={{ width: "50%" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedFeature.properties).map(([key, value]) => (
                    <tr key={key}>
                      <td style={{ wordWrap: "break-word" }}>{key}</td>
                      <td style={{ wordWrap: "break-word" }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </label>
        )}
        {sideBarMode === "Info" && !selectedFeature && <div>Please select a line to see more information</div>}
      </div>
      <div className="ForMap" style={{ height: fullScreenMode ? "100vh" : "90vh", transition: "margin-left 0.5s" }}>
        <MapContainer ref={mapRef} center={center} zoom={13} style={{ height: "100%", width: "100%" }} animate={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          {/* Conditionally render GeoJSON when GeoByBus has data */}
          {GeoByBus && (
            <GeoJSON
              key={JSON.stringify(GeoByBus)}
              data={GeoByBus}
              style={(feature) => ({
                color: selectedFeature && selectedFeature.id === feature.id ? "red" : "blue",
              })}
              onEachFeature={(feature, layer) => {
                // Attach a click event to each feature
                layer.on("click", () => {
                  // Update the selected feature when clicked
                  setSelectedFeature(feature)
                })
              }}
            />
          )}
        </MapContainer>
      </div>
    </>
  )
}

export default App
