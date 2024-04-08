import React from "react"

const GeoOpenContent = ({ selectedOption, selectedFeature, setSelectedFeature }) => {
  return (
    <label>
      {selectedFeature && (
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
                {Object.entries(selectedFeature.properties || selectedFeature.feature.properties).map(([key, value]) => (
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
    </label>
  )
}

export default GeoOpenContent
