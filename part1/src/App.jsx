import { useState, useEffect, useRef } from "react"
import Axios from "axios"
import "./App.css"
import Select from "react-select"
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet"
import "leaflet/dist/leaflet.css" // Import Leaflet CSS

function App() {
  const [count, setCount] = useState(0)
  const [selectedOption, setSelectedOption] = useState("")
  const [backendStatus, setBackendStatus] = useState("Checking...")
  const [vehref, setVehRef] = useState([])
  const [selectedLineOption, setSelectedLineOption] = useState("")
  const [lineref, setLineRef] = useState([])
  const [GeoByBus, setGeoByBus] = useState([])

  const [center, setCenter] = useState([40.612948, -73.925787])

  const [navOpen, setNavOpen] = useState(false)

  const mapRef = useRef(null) // Add this line to create the mapRef

  const [trueBounds, setTrueBounds] = useState()

  const handleDropdownChange = (event) => {
    console.log(event.value)
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
          fetchBus(), fetchLine()
        } else if (response.data.status === "Wait") {
          setBackendStatus("Backend is not ready.")
          // Retry after 20 seconds
          setTimeout(checkServer, 20000)
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
    console.log(vehref)
  }, [vehref])

  // Fetch bus groups from the backend
  const fetchBus = async () => {
    try {
      const response = await Axios.get("https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getVehRef", {
        withCredentials: false,
      })
      // Check the response from the server and set the message accordingly
      if (response.status === 200) {
        setVehRef(response.data)
        console.log(response)
        console.log(vehref)
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
        setLineRef(response.data)
        console.log(response)
        console.log(lineref)
      }
    } catch (e) {
      //console.log(selectedGroup) // Note: This is just for reference, you can remove it
      console.log("There was a problem from reference line Fetch")
      console.log(e)
    }
  }

  // Fetch geo details using bus
  useEffect(() => {
    const fetchGeoByBus = async () => {
      let axiosQuote = "https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getBusTripByVehRef/"
      axiosQuote = axiosQuote + selectedOption
      try {
        const response = await Axios.get(axiosQuote, {
          withCredentials: false,
        })
        // Check the response from the server and set the message accordingly
        if (response.status === 200) {
          setGeoByBus(response.data)
          const bounds = response.data.features.reduce((acc, feature) => {
            const coords = feature.geometry.coordinates[0]
            console.log(coords)
            return acc.extend([coords[1], coords[0]])
          }, L.latLngBounds())

          // Use the getBounds() method to get the bounds of the GeoJSON layer
          const geoJSONLayer = L.geoJSON(response.data)
          const truebounds = geoJSONLayer.getBounds()

          // Fit the map to the new bounds
          //if (mapRef.current) {
          console.log(bounds)
          console.log(truebounds)
          setTrueBounds(truebounds)
          //mapRef.current.fitBounds(truebounds)
          mapRef.current.flyToBounds(bounds)
        }
      } catch (e) {
        //console.log(selectedGroup) // Note: This is just for reference, you can remove it
        console.log("There was a problem from Geo By Bus")
        console.log(e)
      }
    }
    fetchGeoByBus()
  }, [selectedOption])

  // Fetch geo details using bus
  useEffect(() => {
    const fetchGeoByVehRef = async () => {
      let axiosQuote = "https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip/getBusTripByPubLineName/"
      axiosQuote = axiosQuote + selectedLineOption
      try {
        const response = await Axios.get(axiosQuote, {
          withCredentials: false,
        })
        // Check the response from the server and set the message accordingly
        if (response.status === 200) {
          console.log(response.data)
          setGeoByBus(response.data)
        }
      } catch (e) {
        //console.log(selectedGroup) // Note: This is just for reference, you can remove it
        console.log("There was a problem from Geo By Bus")
        console.log(e)
      }
    }
    fetchGeoByVehRef()
  }, [selectedLineOption])

  // Use another useEffect for updating the map view
  // useEffect(() => {
  //   // Access the Leaflet map instance and update its center
  //   console.log("GG CHECK NOW!")
  //   const truebounds = mapRef.current.getBounds()
  //   console.log(truebounds)
  //   mapRef.current.flyToBounds(truebounds)
  // }, [GeoByBus])

  // Your React component

  //This use effect will trigger whenever the options changes
  // useEffect(() => {
  //   // Initial check
  //   MyMap()
  // }, [])

  // function MyMap() {
  //   setCenter([51.505, -0.09]) // Initial map center
  // }
  //key
  //const key = JSON.stringify{GeoByBus}

  // Assume you have arrays 'vehref' and 'lineref' with your options
  const vehOptions = vehref.map((reference) => ({ value: reference, label: reference }))
  const lineOptions = lineref.map((reference) => ({ value: reference, label: reference }))

  /* Set the width of the side navigation to 250px */
  async function openNav() {
    console.log("hello")
    setNavOpen(true)
  }

  async function closeNav() {
    console.log("hello")
    setNavOpen(false)
  }

  return (
    <>
      <div id="header">
        <button class="openbtn" onClick={openNav}>
          &#9776; Open Sidebar
        </button>
        <h2>Geo Bus</h2>
      </div>
      <div id="mySidenav" className="sidenav" style={{ width: navOpen ? 250 : 0 }}>
        <a href="javascript:void(0)" class="closebtn" onClick={closeNav}>
          &times;
        </a>
        <label>
          <p>Backend Status: {backendStatus}</p>
          <p>Selected Bus Plate: {selectedOption}</p>
          Select an option:
          <Select value={vehOptions.find((opt) => opt.value === selectedOption)} onChange={handleDropdownChange} options={vehOptions} placeholder="Select or type..." />
        </label>
        <label>
          <p>Selected Bus Number: {selectedLineOption}</p>
          Select an option:
          <Select value={lineOptions.find((opt) => opt.value === selectedLineOption)} onChange={handleDropdownLineChange} options={lineOptions} placeholder="Select or type..." />
          <p>Geo Information:</p>
        </label>
      </div>
      <div className="ForMap" style={{ marginLeft: navOpen ? 250 : 0, height: "100vh", transition: "margin-left 0.5s" }}>
        <MapContainer ref={mapRef} center={center} zoom={13} style={{ height: "100%", width: "100%" }} animate={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          {/* Conditionally render GeoJSON when GeoByBus has data */}
          {GeoByBus && <GeoJSON key={JSON.stringify(GeoByBus)} data={GeoByBus} />}
        </MapContainer>
      </div>
    </>
  )
}

export default App
