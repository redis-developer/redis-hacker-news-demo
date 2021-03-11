import React, { Component } from "react"
import moment from "moment"

import "../../styles/components/search/filters.css"

import UpArrow from "../../components/search/svg/upArrow.js"
import DownArrow from "../../components/search/svg/downArrow.js"
import RightArrow from "../../components/search/svg/rightArrow.js"

import DatePicker from "../../components/search/datePicker.js"

export default class extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showTypeDropdown: false,
      showSortByDropdown: false,
      showDateRangeDropdown: false,
      showDatePickerDropdown: false
    }

    this.typeDropdown = React.createRef()
    this.filterDropdown = React.createRef()
    this.dateRangeDropdown = React.createRef()
    this.datePickerDropdown = React.createRef()
  }

  componentDidMount() {
    const self = this
    window.addEventListener("click", function(e) {
      self.handleClickWatcher(e)
    })
  }

  componentWillUnmount() {
    const self = this
    window.removeEventListener("click", function(e) {
      self.handleClickWatcher(e)
    })
  }

  handleClickWatcher = (e) => {
    if (this.typeDropdown.current && this.filterDropdown.current && this.dateRangeDropdown.current && this.datePickerDropdown.current) {
      const isClickOnAnyDropdownEl =
        this.typeDropdown.current.contains(e.target) ||
        this.filterDropdown.current.contains(e.target) ||
        this.dateRangeDropdown.current.contains(e.target) ||
        this.datePickerDropdown.current.contains(e.target)

      if (!isClickOnAnyDropdownEl) {
        this.setState({
          showTypeDropdown: false,
          showSortByDropdown: false,
          showDateRangeDropdown: false,
          showDatePickerDropdown: false
        })
      }
    }
  }

  toggleShowTypeDropdown = () => {
    if (this.state.showTypeDropdown) {
      this.setState({
        showTypeDropdown: false,
        showSortByDropdown: false,
        showDateRangeDropdown: false,
        showDatePickerDropdown: false
      })
    } else {
      this.setState({
        showTypeDropdown: true,
        showSortByDropdown: false,
        showDateRangeDropdown: false,
        showDatePickerDropdown: false
      })
    }
  }

  createLinkForItemTypeButton = (itemTypeButtonValue) => {
    const query = `q=${this.props.searchQuery}`
    const page = "page=1"
    const itemType = `itemType=${itemTypeButtonValue}`
    const dateRange = `dateRange=${this.props.dateRange}`
    const startDate = `startDate=${this.props.startDate}`
    const endDate = `endDate=${this.props.endDate}`
    const sortBy = `sortBy=${this.props.sortBy}`

    return `/search?${query}&${page}&${itemType}&${dateRange}&${startDate}&${endDate}&${sortBy}`
  }

  toggleShowSortByDropdown = () => {
    if (this.state.showSortByDropdown) {
      this.setState({
        showTypeDropdown: false,
        showSortByDropdown: false,
        showDateRangeDropdown: false,
        showDatePickerDropdown: false
      })
    } else {
      this.setState({
        showTypeDropdown: false,
        showSortByDropdown: true,
        showDateRangeDropdown: false,
        showDatePickerDropdown: false
      })
    }
  }

  createLinkForSortByButton = (sortByButtonValue) => {
    const query = `q=${this.props.searchQuery}`
    const page = `page=${this.props.currPageNumber + 1}`
    const itemType = `itemType=${this.props.itemType}`
    const dateRange = `dateRange=${this.props.dateRange}`
    const startDate = `startDate=${this.props.startDate}`
    const endDate = `endDate=${this.props.endDate}`
    const sortBy = `sortBy=${sortByButtonValue}`

    return `/search?${query}&${page}&${itemType}&${dateRange}&${startDate}&${endDate}&${sortBy}`
  }

  toggleShowDateRangeDropdown = () => {
    if (this.state.showDateRangeDropdown) {
      this.setState({
        showTypeDropdown: false,
        showSortByDropdown: false,
        showDateRangeDropdown: false,
        showDatePickerDropdown: false
      })
    } else {
      this.setState({
        showTypeDropdown: false,
        showSortByDropdown: false,
        showDateRangeDropdown: true,
        showDatePickerDropdown: false
      })
    }
  }

  renderDateRangeDropdownLabel = () => {
    if (this.props.dateRange === "allTime") {
      return "All Time"
    } else if (this.props.dateRange === "last24h") {
      return "Last 24h"
    } else if (this.props.dateRange === "pastWeek") {
      return "Past Week"
    } else if (this.props.dateRange === "pastMonth") {
      return "Past Month"
    } else if (this.props.dateRange === "pastYear") {
      return "Past Year"
    } else if (this.props.dateRange === "custom") {
      if (this.props.startDate && this.props.endDate) {
        const startDate = moment.unix(this.props.startDate).format("MMM Do YYYY")
        const endDate = moment.unix(this.props.endDate).format("MMM Do YYYY")

        return (
          <>
            <span>{startDate}</span>
            <span>
              <RightArrow />
            </span>
            <span>{endDate}</span>
          </>
        )
      } else {
        return "Custom Range"
      }
    } else {
      return "All Time"
    }
  }

  createLinkForDateRangeButton = (dateRangeButtonValue) => {
    const query = `q=${this.props.searchQuery}`
    const page = "page=1"
    const itemType = `itemType=${this.props.itemType}`
    const dateRange = `dateRange=${dateRangeButtonValue}`
    const startDate = `startDate=${this.props.startDate}`
    const endDate = `endDate=${this.props.endDate}`
    const sortBy = `sortBy=${this.props.sortBy}`

    return `/search?${query}&${page}&${itemType}&${dateRange}&${startDate}&${endDate}&${sortBy}`
  }

  showDatePicker = () => {
    this.setState({
      showTypeDropdown: false,
      showSortByDropdown: false,
      showDateRangeDropdown: false,
      showDatePickerDropdown: true
    })
  }

  hideDatePicker = () => {
    this.setState({
      showTypeDropdown: false,
      showSortByDropdown: false,
      showDateRangeDropdown: false,
      showDatePickerDropdown: false
    })
  }

  submitDatePicker = (from, to) => {
    const startTimestamp = moment.unix(moment(from).unix()).startOf("day").unix()
    const endTimestamp = moment.unix(moment(to).unix()).endOf("day").unix()

    const query = `q=${this.props.searchQuery}`
    const page = "page=1"
    const itemType = `itemType=${this.props.itemType}`
    const dateRange = `dateRange=custom`
    const startDate = `startDate=${startTimestamp}`
    const endDate = `endDate=${endTimestamp}`
    const sortBy = `sortBy=${this.props.sortBy}`

    window.location.href = `/search?${query}&${page}&${itemType}&${dateRange}&${startDate}&${endDate}&${sortBy}`
  }

  render() {
    return (
      <div className="search-results-filters-container">
        <div className="search-results-filters">
          <span className="search-results-filter">
            <span className="search-results-filter-text">Search</span>
            <div className="search-results-filter-dropdown" ref={this.typeDropdown}>
              <label className="search-results-filter-dropdown-label" onClick={() => this.toggleShowTypeDropdown()}>
                {this.props.itemType === "item" ? "Items" : null}
                {this.props.itemType === "comment" ? "Comments" : null}
                {this.props.itemType !== "item" && this.props.itemType !== "comment" ? "All" : null}
                {this.state.showTypeDropdown ? <UpArrow /> : <DownArrow />}
              </label>
              <ul className={this.state.showTypeDropdown ? "search-results-filter-dropdown-list" : "search-results-filter-dropdown-list hide"}>
                <li>
                  <a href={this.createLinkForItemTypeButton("all")}>
                    <button>All</button>
                  </a>
                </li>
                <li>
                  <a href={this.createLinkForItemTypeButton("item")}>
                    <button>Items</button>
                  </a>
                </li>
                <li>
                  <a href={this.createLinkForItemTypeButton("comment")}>
                    <button>Comments</button>
                  </a>
                </li>
              </ul>
            </div>
          </span>
          <span className="search-results-filter">
            <span className="search-results-filter-text">by</span>
            <div className="search-results-filter-dropdown" ref={this.filterDropdown}>
              <label className="search-results-filter-dropdown-label" onClick={() => this.toggleShowSortByDropdown()}>
                {this.props.sortBy === "popularity" || !this.props.sortBy ? "Popularity" : null}
                {this.props.sortBy === "date" ? "Date" : null}
                {this.state.showSortByDropdown ? <UpArrow /> : <DownArrow />}
              </label>
              <ul className={this.state.showSortByDropdown ? "search-results-filter-dropdown-list" : "search-results-filter-dropdown-list hide"}>
                <li>
                  <a href={this.createLinkForSortByButton("popularity")}>
                    <button>Popularity</button>
                  </a>
                </li>
                <li>
                  <a href={this.createLinkForSortByButton("date")}>
                    <button>Date</button>
                  </a>
                </li>
              </ul>
            </div>
          </span>
          <span className="search-results-filter">
            <span className="search-results-filter-text">for</span>
            <div className="search-results-filter-dropdown" ref={this.dateRangeDropdown}>
              <label className="search-results-filter-dropdown-label" onClick={() => this.toggleShowDateRangeDropdown()}>
                {this.renderDateRangeDropdownLabel()}
                {this.state.showDateRangeDropdown ? <UpArrow /> : <DownArrow />}
              </label>
              <ul className={this.state.showDateRangeDropdown ? "search-results-filter-dropdown-list" : "search-results-filter-dropdown-list hide"}>
                <li>
                  <a href={this.createLinkForDateRangeButton("allTime")}>
                    <button>All Time</button>
                  </a>
                </li>
                <li>
                  <a href={this.createLinkForDateRangeButton("last24h")}>
                    <button>Last 24h</button>
                  </a>
                </li>
                <li>
                  <a href={this.createLinkForDateRangeButton("pastWeek")}>
                    <button>Past Week</button>
                  </a>
                </li>
                <li>
                  <a href={this.createLinkForDateRangeButton("pastMonth")}>
                    <button>Past Month</button>
                  </a>
                </li>
                <li>
                  <a href={this.createLinkForDateRangeButton("pastYear")}>
                    <button>Past Year</button>
                  </a>
                </li>
                <li>
                  <button onClick={() => this.showDatePicker()}>Custom Range</button>
                </li>
              </ul>
            </div>
            <DatePicker
              elRef={this.datePickerDropdown}
              show={this.state.showDatePickerDropdown}
              hideDatePicker={this.hideDatePicker}
              submitDatePicker={this.submitDatePicker}
              startDate={this.props.startDate}
              endDate={this.props.endDate}
            />
          </span>
        </div>
        <div className="search-results-filters-stats">
          <span>{this.props.totalNumOfHits} results</span>
          <span className="search-results-filters-stats-time">({this.props.processingTimeMS * 0.001} seconds)</span>
        </div>
      </div>
    )
  }
}
