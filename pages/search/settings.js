import { Component } from "react"
import Cookie from "js-cookie"

import "../../styles/pages/search/settings.css"

import HeadMetadata from "../../components/headMetadata.js"
import SearchPageHeader from "../../components/search/header.js"
import SearchPageFooter from "../../components/search/footer.js"
import GoogleAnalytics from "../../components/googleAnalytics.js"

import getCookiesFromReq from "../../utils/getCookiesFromReq.js"

export default class extends Component {
  static async getInitialProps ({req}) {
    const cookieObj = getCookiesFromReq(req.headers.cookie)

    return {
      defaultHitsPerPage: cookieObj.searchHitsPerPage,
      defaultType: cookieObj.searchDefaultType,
      defaultSort: cookieObj.searchDefaultSort,
      defaultDateRange: cookieObj.searchDefaultDateRange,
      typoTolerance: cookieObj.searchUseTypoTolerance
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      defaultHitsPerPageValue: this.props.defaultHitsPerPage ? this.props.defaultHitsPerPage : "30",
      defaultTypeValue: this.props.defaultType ? this.props.defaultType : "all",
      defaultSortValue: this.props.defaultSort ? this.props.defaultSort : "popularity",
      defaultDateRangeValue: this.props.defaultDateRange ? this.props.defaultDateRange : "allTime",
      useTypoToleranceValue: this.props.typoTolerance ? (this.props.typoTolerance === "true" ? true : false) : true,
      submitButtonActive: false
    }
  }

  componentDidMount() {
    if (!this.props.defaultHitsPerPage) Cookie.set("searchHitsPerPage", "30", {expires: 365})
    if (!this.props.defaultType) Cookie.set("searchDefaultType", "all", {expires: 365})
    if (!this.props.defaultSort) Cookie.set("searchDefaultSort", "popularity", {expires: 365})
    if (!this.props.defaultDateRange) Cookie.set("searchDefaultDateRange", "allTime", {expires: 365})
    if (!this.props.typoTolerance) Cookie.set("searchUseTypoTolerance", true, {expires: 365})
  }

  updateDefaultHitsPerPageValue = (event) => {
    this.setState({defaultHitsPerPageValue: event.target.value})

    if (!this.state.submitButtonActive) this.setState({submitButtonActive: true})
  }

  updateDefaultTypeValue = (event) => {
    this.setState({defaultTypeValue: event.target.value})

    if (!this.state.submitButtonActive) this.setState({submitButtonActive: true})
  }

  updateDefaultSortValue = (event) => {
    this.setState({defaultSortValue: event.target.value})

    if (!this.state.submitButtonActive) this.setState({submitButtonActive: true})
  }

  updateDefaultDateRangeValue = (event) => {
    this.setState({defaultDateRangeValue: event.target.value})

    if (!this.state.submitButtonActive) this.setState({submitButtonActive: true})
  }

  updateUseTypoToleranceValue = () => {
    if (this.state.useTypoToleranceValue) {
      this.setState({useTypoToleranceValue: false})
    } else {
      this.setState({useTypoToleranceValue: true})
    }

    if (!this.state.submitButtonActive) this.setState({submitButtonActive: true})
  }

  submitChanges = () => {
    Cookie.set("searchHitsPerPage", this.state.defaultHitsPerPageValue, {expires: 365})
    Cookie.set("searchDefaultType", this.state.defaultTypeValue, {expires: 365})
    Cookie.set("searchDefaultSort", this.state.defaultSortValue, {expires: 365})
    Cookie.set("searchDefaultDateRange", this.state.defaultDateRangeValue, {expires: 365})
    Cookie.set("searchUseTypoTolerance", this.state.useTypoToleranceValue, {expires: 365})

    this.setState({submitButtonActive: false})
  }

  render () {
    return (
      <div className="search-settings-wrapper">
        <HeadMetadata
          title="Search Settings | Hacker News"
        />
        <GoogleAnalytics />
        <SearchPageHeader
          showBackButton={true}
        />
        <div className="search-settings-content">
          <div className="search-settings-page-label">
            <span>Settings</span>
          </div>
          <div className="search-settings-options-fields">
            <h2>Search Options</h2>
            <div className="search-settings-options-field">
              <label>Hits per page</label>
              <div className="search-settings-options-field-input">
                <select value={this.state.defaultHitsPerPageValue} onChange={this.updateDefaultHitsPerPageValue}>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
            <div className="search-settings-options-field">
              <label>Default type</label>
              <div className="search-settings-options-field-input">
                <select value={this.state.defaultTypeValue} onChange={this.updateDefaultTypeValue}>
                  <option value="all">All</option>
                  <option value="item">Items</option>
                  <option value="comment">Comments</option>
                </select>
              </div>
            </div>
            <div className="search-settings-options-field">
              <label>Default sorting</label>
              <div className="search-settings-options-field-input">
                <select value={this.state.defaultSortValue} onChange={this.updateDefaultSortValue}>
                  <option value="popularity">Most popular first</option>
                  <option value="date">Most recent first</option>
                </select>
              </div>
            </div>
            <div className="search-settings-options-field">
              <label>Default date range</label>
              <div className="search-settings-options-field-input">
                <select value={this.state.defaultDateRangeValue} onChange={this.updateDefaultDateRangeValue}>
                  <option value="last24h">Last 24h</option>
                  <option value="pastWeek">Past week</option>
                  <option value="pastMonth">Past month</option>
                  <option value="pastYear">Past year</option>
                  <option value="allTime">All-Time</option>
                </select>
              </div>
            </div>
            <div className="search-settings-options-field">
              <label>Typo-tolerance</label>
              <div className="search-settings-options-field-input">
                <input
                  type="checkbox"
                  checked={this.state.useTypoToleranceValue}
                  onChange={this.updateUseTypoToleranceValue}
                />
              </div>
            </div>
          </div>
          <div className="search-settings-apply-changes">
            {
              this.state.submitButtonActive ?
              <button className="active" onClick={this.submitChanges}>Apply</button> :
              <button>Apply</button>
            }
          </div>
        </div>
        <SearchPageFooter />
      </div>
    )
  }
}
