import { Component } from "react"

import "../styles/pages/edit-item.css"

import renderCreatedTime from "../utils/renderCreatedTime.js"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getEditItemPageData from "../api/items/getEditItemPageData.js"
import editItem from "../api/items/editItem.js"

export default class extends Component {
  static async getInitialProps({ query, req }) {
    const apiResult = await getEditItemPageData(query.id, req)

    return {
      item: apiResult && apiResult.item,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      getDataError: apiResult && apiResult.getDataError,
      notAllowedError: apiResult && apiResult.notAllowedError,
      notFoundError: apiResult && apiResult.notFoundError,
      goToString: `edit-item?id=${query.id}`
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      notAllowedError: this.props.notAllowedError,
      notFoundError: this.props.notFoundError,
      titleInputValue: this.props.item ? this.props.item.title : "",
      textInputValue: this.props.item ? this.props.item.textForEditing: "",
      loading: false,
      titleRequiredError: false,
      titleTooLongError: false,
      textTooLongError: false,
      submitError: false
    }
  }

  updateTitleInputValue = (event) => {
    this.setState({titleInputValue: event.target.value})
  }

  setInitialTextareaHeight = () => {
    if (this.props.item.text) {
      const numOfLines = this.props.item.text.split(/\r\n|\r|\n/).length

      return numOfLines + 4
    } else {
      return 6
    }
  }

  updateTextInputValue = (event) => {
    this.setState({textInputValue: event.target.value})
  }

  submitEditItem = () => {
    if (this.state.loading) return

    if (!this.state.titleInputValue.trim()) {
      this.setState({
        titleRequiredError: true,
        titleTooLongError: false,
        textTooLongError: false,
        submitError: false
      })
    } else if (this.state.titleInputValue.length > 80) {
      this.setState({
        titleRequiredError: false,
        titleTooLongError: true,
        textTooLongError: false,
        submitError: false
      })
    } else if (this.state.textInputValue.length > 5000) {
      this.setState({
        titleRequiredError: false,
        titleTooLongError: false,
        textTooLongError: true,
        submitError: false
      })
    } else {
      this.setState({loading: true})

      const self = this

      editItem(this.props.item.id, this.state.titleInputValue, this.state.textInputValue, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${self.props.goToString}`
        } else if (response.notAllowedError) {
          self.setState({
            loading: false,
            notAllowedError: true
          })
        } else if (response.titleTooLongError) {
          self.setState({
            loading: false,
            titleRequiredError: false,
            titleTooLongError: true,
            textTooLongError: false,
            submitError: false
          })
        } else if (response.textTooLongError) {
          self.setState({
            loading: false,
            titleRequiredError: false,
            titleTooLongError: false,
            textTooLongError: true,
            submitError: false
          })
        } else if (response.submitError || !response.success) {
          self.setState({
            loading: false,
            titleRequiredError: false,
            titleTooLongError: false,
            textTooLongError: false,
            submitError: true
          })
        } else {
          window.location.href = `/item?id=${self.props.item.id}`
        }
      })
    }
  }

  render () {
    const item = this.props.item

    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Edit Item | Hacker News"
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
          label="edit item"
        />
        <div className="edit-item-content-container">
          {
            !this.props.getDataError && !this.state.notAllowedError && !this.state.notFoundError ?
            <>
              <table className="edit-item-top-section">
                <tbody>
                  <tr>
                    <td valign="top">
                      <div className="edit-item-star">
                        <span>*</span>
                      </div>
                    </td>
                    <td>
                      <span className="edit-item-title">
                        <a href={item.url ? item.url : `/item?id=${item.id}`}>{item.title}</a>
                      </span>
                      {
                        item.url ?
                        <span className="edit-item-domain">
                          (<a href={`/from?site=${item.domain}`}>{item.domain}</a>)
                        </span> : null
                      }
                    </td>
                  </tr>
                  <tr className="edit-item-details-bottom">
                    <td colSpan="1"></td>
                    <td>
                      <span className="edit-item-score">{item.points.toLocaleString()} {item.points === 1 ? "point" : "points"}</span>
                      <span> by <a href={`/user?id=${item.by}`}>{item.by}</a> </span>
                      <span className="edit-item-time">
                        <a href={`/item?id=${item.id}`}>{renderCreatedTime(item.created)}</a>
                      </span>
                      <span> | </span>
                      <span className="edit-item-edit">
                        <a href="">edit</a>
                      </span>
                      <span> | </span>
                      <span>
                        <a href={`/delete-item?id=${item.id}`}>delete</a>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              {
                !item.url && item.text ?
                <div className="edit-item-text-content">
                  <span dangerouslySetInnerHTML={{ __html: item.text }}></span>
                </div> : null
              }
              <table className="edit-item-form-section">
                <tbody>
                  <tr>
                    <td className="edit-item-title-input-label">title:</td>
                    <td className="edit-item-title-input">
                      <input
                        type="text"
                        value={this.state.titleInputValue}
                        onChange={this.updateTitleInputValue}
                      />
                    </td>
                  </tr>
                  {
                    item.url ?
                    <tr>
                      <td className="edit-item-url-label">url:</td>
                      <td className="edit-item-url-value">{item.url}</td>
                    </tr> : null
                  }
                  {
                    !item.url ?
                    <tr>
                      <td className="edit-item-text-input-label">text:</td>
                      <td className="edit-item-text-input">
                        <textarea
                          type="text"
                          cols={60}
                          rows={this.setInitialTextareaHeight()}
                          value={this.state.textInputValue}
                          onChange={this.updateTextInputValue}
                        />
                      </td>
                    </tr> : null
                  }
                </tbody>
              </table>
              <div className="edit-item-submit-btn">
                <input
                  type="submit"
                  value="update"
                  onClick={() => this.submitEditItem()}
                />
              </div>
              {
                this.state.submitError ?
                <div className="edit-item-submit-error-msg">
                  <span>An error occurred.</span>
                </div> : null
              }
              {
                this.state.titleRequiredError ?
                <div className="edit-item-submit-error-msg">
                  <span>Title is required.</span>
                </div> : null
              }
              {
                this.state.titleTooLongError ?
                <div className="edit-item-submit-error-msg">
                  <span>Title exceeds limit of 80 characters.</span>
                </div> : null
              }
              {
                this.state.textTooLongError ?
                <div className="edit-item-submit-error-msg">
                  <span>Text exceeds limit of 5,000 characters.</span>
                </div> : null
              }
            </> :
            <div className="edit-item-error-msg">
              {
                this.props.getDataError ?
                <span>An error occurred.</span> : null
              }
              {
                this.state.notAllowedError ?
                <span>You can’t edit that item.</span> : null
              }
              {
                this.state.notFoundError ?
                <span>Item not found.</span> : null
              }
            </div>
          }
        </div>
        <Footer />
      </div>
    )
  }
}
