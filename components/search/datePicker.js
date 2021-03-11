import { Component } from "react"
import DayPicker, { DateUtils } from "react-day-picker"
import moment from "moment"

import "react-day-picker/lib/style.css"
import "../../styles/components/search/datePicker.css"

import CancelIcon from "./svg/cancelIcon.js"

const getInitialFromDate = (timestamp) => {
  if (timestamp) {
    return moment.unix(timestamp).toDate()
  } else {
    return moment().subtract(7, "day").toDate()
  }
}

const getInitialToDate = (timestamp) => {
  if (timestamp) {
    return moment.unix(timestamp).toDate()
  } else {
    return moment().toDate()
  }
}

export default class extends Component {
  constructor(props) {
    super(props)
    this.state = {
      from: getInitialFromDate(this.props.startDate),
      to: getInitialToDate(this.props.endDate)
    }
  }

  handleDayClick = (day, modifiers) => {
    if (!modifiers.disabled) {
      const range = DateUtils.addDayToRange(day, this.state)
      this.setState({
        from: range.from,
        to: range.to
      })
    }
  }

  updateFromInputValue = (event) => {
    this.setState({
      from: moment(event.target.value).toDate()
    })
  }

  updateToInputValue = (event) => {
    this.setState({
      to: moment(event.target.value).toDate()
    })
  }

  requestCancel = () => {
    this.setState({
      from: getInitialFromDate(this.props.startDate),
      to: getInitialToDate(this.props.endDate)
    })

    this.props.hideDatePicker()
  }

  render() {
    const {from, to} = this.state

    return (
      <div className={this.props.show ? "date-picker-dropdown" : "date-picker-dropdown hide"} ref={this.props.elRef}>
        <div className="date-picker-container">
          <DayPicker
            numberOfMonths={1}
            selectedDays={[from, { from, to }]}
            onDayClick={this.handleDayClick}
            disabledDays={{after: new Date()}}
          />
          <div className="date-picker-form">
            <fieldset>
              <h3>Custom Date Range</h3>
              <div>
                <label>From</label>
                <input
                  type="date"
                  placeholder="From date"
                  value={moment(this.state.from).format("YYYY-MM-DD")}
                  onChange={this.updateFromInputValue}
                />
              </div>
              <div>
                <label>To</label>
                <input
                  type="date"
                  placeholder="To date"
                  value={moment(this.state.to).format("YYYY-MM-DD")}
                  onChange={this.updateToInputValue}
                 />
              </div>
              <div className="date-picker-action-buttons">
                <button onClick={() => this.requestCancel()}>
                  <CancelIcon />
                  Cancel
                </button>
                <button type="submit" onClick={() => this.props.submitDatePicker(from, to)}>
                  Apply
                </button>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    )
  }
}
