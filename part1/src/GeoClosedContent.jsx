import React from "react"
import Select from "react-select"

const GeoClosedContent = ({ selectedOption, setSelectedOption, selectedLineOption, setSelectedLineOption, handleDropdownChange, handleDropdownLineChange, historyLine, historyVehRef, clearHistory, DeleteIcon, lineOptions, vehOptions }) => {
  return (
    <label>
      <label>
        <h4>Select a Vehicle Reference:</h4>
        <Select value={selectedOption} onChange={handleDropdownChange} options={vehOptions} placeholder="Select or type..." />
        <div>
          Past Searches:
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
      </label>
      <label>
        <h4>Select a Published Line:</h4>
        <Select value={lineOptions.find((opt) => opt.value === selectedLineOption)} onChange={handleDropdownLineChange} options={lineOptions} placeholder="Select or type..." />
        <div>
          Past Searches:
          {historyLine.map((item, index) => (
            <button id="history-button" key={index} onClick={() => setSelectedLineOption(item)}>
              {item}
            </button>
          ))}
          {historyLine.length > "0" && (
            <button class="history-button" onClick={() => clearHistory("historyLine")}>
              <DeleteIcon />
            </button>
          )}
        </div>
      </label>
    </label>
  )
}

export default GeoClosedContent
