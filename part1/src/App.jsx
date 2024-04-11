import { useState, useEffect, useRef } from "react"
import Axios from "axios"
import "./App.css"
import Select from "react-select"
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet"
import "leaflet/dist/leaflet.css" // Import Leaflet CSS
import "bootstrap/dist/css/bootstrap.min.css"
import Button from "react-bootstrap/Button"
import ButtonGroup from "react-bootstrap/ButtonGroup"
import Alert from "@mui/material/Alert"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
// import ReactSelect from "react-windowed-select" //React window to speed up loading of react select options
// import { FixedSizeList } from "react-window"

import GeoOpenContent from "./GeoOpenContent.jsx"
import GeoClosedContent from "./GeoClosedContent.jsx"
import LatLongMode from "./LatLongMode.jsx"
import AxisMode from "./AxisMode.jsx"

function App() {
  const [selectedOption, setSelectedOption] = useState(null)
  const [backendStatus, setBackendStatus] = useState("Checking...")
  const [vehref, setVehRef] = useState([])
  const [selectedLineOption, setSelectedLineOption] = useState(null)
  const [lineref, setLineRef] = useState([])
  const [GeoByBus, setGeoByBus] = useState([])

  const [center, setCenter] = useState([40.612948, -73.925787])
  // Controls the side bar
  const [navOpen, setNavOpen] = useState(false)
  //needed to move map
  const mapRef = useRef(null) // Add this line to create the mapRef

  //const [trueBounds, setTrueBounds] = useState()
  //For the mouse clicking on the map to show feature details
  const [selectedFeature, setSelectedFeature] = useState("") // used to see which place the user has selected

  // Controls the geo information toggle button
  const [sideBarMode, setSideBarMode] = useState("Bus")

  //For saving history of ref and line
  const [historyVehRef, setHistoryVehRef] = useState(JSON.parse(localStorage.getItem("historyVehRef")) || [])
  const [historyLine, setHistoryLine] = useState(JSON.parse(localStorage.getItem("historyLine")) || [])

  //For toggling full screen mode
  const [fullScreenMode, setFullScreenMode] = useState(false)

  //For alert messages
  const [ToastMessage, setToastMessage] = useState()

  //For switching modes between straight route and actual route
  const [actualGeoMode, setActualGeoMode] = useState(false)

  //this const is used to store latlong geojson data
  const [geoByLatLong, setGeoByLatLong] = useState([])

  //For tracking whether need to update geoByLatLong
  const [newSearch, setNewSearch] = useState(false)

  //This const is used to store the straight route geoJSOn data when user switch to actualGeoMode
  const [geoByStraightRoute, setGeoByStraightRoute] = useState([])

  //Saving the first closest start point and the last
  const [closestStart, setClosestStart] = useState([])
  const [closestGoal, setClosestGoal] = useState([])

  //This const is used to change the hue of the marker color
  const markerHueChangeClass = "huechange"

  //This const is needed to determine whether a marker or a line feature was clicked
  const [markerSelected, setMarkerSelected] = useState(false)

  //This const is to set the loading state
  const [isLoading, setIsLoading] = useState(false)
  const [positionMarker, setPositionMarker] = useState([40.662674, -73.957116])

  const handleDropdownChange = (event) => {
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
    // Checker
    console.log("Changes detected!!!!!!!1")
    console.log("selectedOption" + selectedOption)
    console.log(selectedOption)
  }, [selectedOption])

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
      if (selectedOption != null) {
        console.log("setIsLoading true")
        setIsLoading(true)
        //Always start with straight lines first
        setActualGeoMode(false)
        let axiosQuote = "https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getBusTripByVehRef/"
        axiosQuote = axiosQuote + selectedOption
        try {
          const response = await Axios.get(axiosQuote, {
            withCredentials: false,
          })
          // Check the response from the server and set the message accordingly
          if (response.status === 200) {
            setSelectedLineOption(null)
            console.log(response.data)
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
              console.log(GeoByBus)
            } else {
              setGeoByBus(response.data)
              console.log(GeoByBus)
            }

            console.log(GeoByBus)
            console.log(response.data)
            // Use the getBounds() method to get the bounds of the GeoJSON layer
            const geoJSONLayer = L.geoJSON(response.data)
            const truebounds = geoJSONLayer.getBounds()

            mapRef.current.flyToBounds(truebounds)
            //Call function to record history
            recordHistory("historyVehRef", historyVehRef, selectedOption)
            console.log(historyVehRef)
            console.log(GeoByBus)
            //set new search equals true as this is a new search
            setNewSearch(true)
            //record for toggle use
            setGeoByStraightRoute(GeoByBus)
            //SetLoading false
            console.log("setIsLoading false")
            setIsLoading(false)
            //Toasify to show display
            toast.success("Displaying Vehicle Reference: " + selectedOption)
          }
        } catch (e) {
          //console.log(selectedGroup) // Note: This is just for reference, you can remove it
          console.log("There was a problem from Geo By Bus")
          console.log(e)
          //SetLoading false
          console.log("setIsLoading false")
          setIsLoading(false)
        }
      }
    }
    fetchGeoByVehRef()
  }, [selectedOption])

  // Fetch geo details using bus
  useEffect(() => {
    const fetchGeoByLine = async () => {
      if (selectedLineOption != null) {
        console.log("setIsLoading true")
        setIsLoading(true)
        //Always start with straight lines first
        setActualGeoMode(false)
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
              setGeoByBus(geoJsonWithIds)
            } else {
              setGeoByBus(response.data)
            }

            // Use the getBounds() method to get the bounds of the GeoJSON layer
            const geoJSONLayer = L.geoJSON(response.data)
            const truebounds = geoJSONLayer.getBounds()

            // Fit the map to the new bounds
            console.log(truebounds)

            //make map go there
            mapRef.current.flyToBounds(truebounds)
            //Call function to record
            recordHistory("historyLine", historyLine, selectedLineOption)
            console.log(historyLine)
            //record for toggle use
            setGeoByStraightRoute(GeoByBus)
            //set new search equals true as this is a new search
            setNewSearch(true)
            console.log("setIsLoading false")
            setIsLoading(false)
            toast.success("Displaying Published Line: " + selectedLineOption)
          }
        } catch (e) {
          //console.log(selectedGroup) // Note: This is just for reference, you can remove it
          console.log("There was a problem from Geo By veh ref")
          console.log(e)
          //SetLoading false
          console.log("setIsLoading false")
          setIsLoading(false)
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
    if (mode === "back") {
      setSideBarMode
    } else {
      setSideBarMode(mode)
    }
    console.log("toggling to " + mode)
    //}
  }

  // To map our options so that we can use in react select, failure to map results in frontend dropdown box unable
  // to display currently selected options
  const vehOptions = vehref.map((reference) => ({ value: reference, label: reference }))
  const lineOptions = lineref.map((reference) => ({ value: reference, label: reference }))

  //use for react-window-select, to resolve the slow loading, use lazy loading
  // const CustomVehOption = ({ data, index, style }) => {
  //   const option = data[index]
  //   return <div style={style}>{option.label}</div>
  // }

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
  ///////////////////////////////////////////////////////////////////
  //Colour of the marker on leaflet
  ///////////////////////////////////////////////////////////////////
  // Function to handle marker click and change its color
  // Define the CSS class for marker hue change
  async function handleMarkerClick(marker) {
    console.log("Handlemarkerclick")
    await new Promise((resolve) => setTimeout(resolve, 0))
    console.log("selectedfeature" + selectedFeature)

    // Remove the huechange class from all markers
    switchOffAllMarkers()

    if (!marker._icon.classList.contains("huechange")) {
      // Add the class for hue change to the marker's icon element
      marker._icon.classList.add("huechange")
    } else {
      // If the class is already added, remove it
      marker._icon.classList.remove("huechange")
    }
    //}
    // // Toggle mode to 'Info' or any other mode as needed
    // toggleMode("Info")
  }

  // useEffect(() => {
  //   // This effect runs whenever selectedFeature changes
  //   console.log("Selected feature changed:", selectedFeature)
  //   console.log(selectedFeature.feature)
  //   if (selectedFeature.feature !== undefined) {
  //     handleMarkerClick(selectedFeature) // Call handleMarkerClick with the updated selectedFeature
  //   }
  // }, [selectedFeature]) // This effect depends on selectedFeature

  ///////////////////////////////////////////////////////////////
  //This function will turn all markers back to blue(off indicator)
  ///////////////////////////////////////////////////////////////
  async function switchOffAllMarkers() {
    console.log("TURN OFF ALL MARKER")
    const allMarkers = document.querySelectorAll(".leaflet-marker-icon")
    allMarkers.forEach((m) => {
      m.classList.remove("huechange")
    })
  }
  return (
    <>
      <div className={fullScreenMode ? "header-close" : "header"} style={{ height: fullScreenMode ? "0vh" : "10vh", overflowX: "auto" }}>
        <button className="openbtn" onClick={openNav} style={{ backgroundColor: backendStatus === "Backend is ready!" ? "green" : "red" }}>
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
        <div>
          <a href="#" className="closebtn" onClick={closeNav}>
            &times;
          </a>
        </div>
        <ButtonGroup aria-label="Basic example">
          <Button variant={sideBarMode === "Bus" ? "dark" : "outline-dark"} onClick={() => toggleMode("Bus")} active={sideBarMode === "Bus"}>
            Bus Route
          </Button>
          {/* <Button variant="secondary" onClick={switchLatLong} active={sideBarMode === "LatLong"}>
            LatLong
          </Button> */}
          <Button variant={sideBarMode === "Axis" ? "dark" : "outline-dark"} onClick={() => toggleMode("Axis")} active={sideBarMode === "Axis"}>
            Road Type
          </Button>
          <Button variant={sideBarMode === "Info" ? "dark" : "outline-dark"} onClick={() => toggleMode("Info")} active={sideBarMode === "Info"}>
            Info
          </Button>
        </ButtonGroup>

        {sideBarMode === "Bus" && <GeoClosedContent selectedOption={selectedOption} setSelectedOption={setSelectedOption} selectedLineOption={selectedLineOption} setSelectedLineOption={setSelectedLineOption} handleDropdownChange={handleDropdownChange} handleDropdownLineChange={handleDropdownLineChange} vehOptions={vehOptions} lineOptions={lineOptions} historyLine={historyLine} historyVehRef={historyVehRef} clearHistory={clearHistory} GeoByBus={GeoByBus} setGeoByBus={setGeoByBus} geoByLatLong={geoByLatLong} setGeoByLatLong={setGeoByLatLong} isLoading={isLoading} setIsLoading={setIsLoading} actualGeoMode={actualGeoMode} setActualGeoMode={setActualGeoMode} geoByStraightRoute={geoByStraightRoute} setGeoByStraightRoute={setGeoByStraightRoute} closestStart={closestStart} setClosestStart={setClosestStart} closestGoal={closestGoal} setClosestGoal={setClosestGoal} newSearch={newSearch} setNewSearch={setNewSearch} />}

        {sideBarMode === "LatLong" && <LatLongMode></LatLongMode>}

        {sideBarMode === "Axis" && <AxisMode></AxisMode>}

        {sideBarMode === "Info" && <GeoOpenContent selectedOption={selectedOption} selectedLineOption={selectedLineOption} selectedFeature={selectedFeature} setSelectedFeature={setSelectedFeature} />}

        {sideBarMode === "Info" && !selectedFeature && <div>Please select a line to see more information</div>}
      </div>
      <div className="ForMap" style={{ height: fullScreenMode ? "100vh" : "90vh", transition: "margin-left 0.5s" }}>
        <MapContainer ref={mapRef} center={center} zoom={13} style={{ height: "100%", width: "100%" }} animate={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          <Marker position={positionMarker}>
            <Popup>
              A pretty CSS3 popup. <br /> Easily customizable.
            </Popup>
          </Marker>
          {/* Conditionally render GeoJSON when GeoByBus has data */}
          {GeoByBus && (
            <GeoJSON
              key={JSON.stringify(GeoByBus)}
              data={GeoByBus}
              style={(feature) => ({
                color: selectedFeature && selectedFeature.id === feature.id ? "red" : "blue",
              })}
              onEachFeature={(feature, layer) => {
                // Update the selected marker when clicked
                if (layer instanceof L.Marker) {
                  layer.on("click", () => {
                    //console.log("layerfeature" + layer.feature)
                    //console.log("selectedfeature" + selectedFeature)
                    setSelectedFeature(layer)
                    console.log("selectedfeature" + selectedFeature)
                    console.log("OPTION 1")
                    handleMarkerClick(layer)
                    //switchOffAllMarkers()
                    toggleMode("Info")
                  })
                  //handle selecting lines
                } else {
                  layer.on("click", () => {
                    setSelectedFeature(feature)
                    console.log(feature)
                    console.log("OPTION 2")
                    switchOffAllMarkers()
                    toggleMode("Info")
                  })
                }
              }}
            />
          )}
        </MapContainer>
      </div>
    </>
  )
}

export default App
