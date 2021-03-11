import { Component } from "react"

import "../styles/pages/delete-item.css"

import renderCreatedTime from "../utils/renderCreatedTime.js"

import AlternateHeader from "../components/alternateHeader.js"
import HeadMetadata from "../components/headMetadata.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getDeleteItemPageData from "../api/items/getDeleteItemPageData.js"
import deleteItem from "../api/items/deleteItem.js"

export default class extends Component {
  static async getInitialProps({ query, req }) {
    const apiResult = await getDeleteItemPageData(query.id, req)

    return {
      item: apiResult && apiResult.item,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      getDataError: apiResult && apiResult.getDataError,
      notAllowedError: apiResult && apiResult.notAllowedError,
      notFoundError: apiResult && apiResult.notFoundError,
      goToString: query.goto ? decodeURIComponent(query.goto) : ""
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      notAllowedError: this.props.notAllowedError,
      notFoundError: this.props.notFoundError,
      loading: false,
      submitError: false
    }
  }

  submitDeleteItem = () => {
    if (this.state.loading) return

    this.setState({loading: true})

    const self = this

    deleteItem(this.props.item.id, function(response) {
      if (response.notAllowedError) {
        self.setState({
          loading: false,
          notAllowedError: true,
          notFoundError: false,
          submitError: false
        })
      } else if (response.notFoundError) {
        self.setState({
          loading: false,
          notAllowedError: false,
          notFoundError: true,
          submitError: false
        })
      } else if (response.submitError || !response.success) {
        self.setState({
          loading: false,
          notAllowedError: false,
          notFoundError: false,
          submitError: true
        })
      } else {
        window.location.href = `/${self.props.goToString}`
      }
    })
  }

  goBackToOriginPage = () => {
    if (this.state.loading) return

    window.location.href = `/${this.props.goToString}`
  }

  render () {
    const item = this.props.item

    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Delete Item | Hacker News"
        />
        <GoogleAnalytics />
        <AlternateHeader
          displayMessage="Delete Item"
        />
        <div className="delete-item-content-container">
          {
            !this.props.getDataError && !this.state.notAllowedError && !this.state.notFoundError ?
            <>
              <div className="delete-item-top-section">
                <table>
                  <tbody>
                    <tr>
                      <td valign="top">
                        <div className="delete-item-star">
                          <span>*</span>
                        </div>
                      </td>
                      <td>
                        <span className="delete-item-title">
                          <a href={item.url}>{item.title}</a>
                        </span>
                        {
                          item.url ?
                          <span className="delete-item-domain">
                            (<a href={`/from?site=${item.domain}`}>{item.domain}</a>)
                          </span> : null
                        }
                      </td>
                    </tr>
                    <tr className="delete-item-details-bottom">
                      <td colSpan="1"></td>
                      <td>
                        <span className="delete-item-score">{item.points.toLocaleString()} {item.points === 1 ? "point" : "points"}</span>
                        <span> by <a href={`/user?id=${item.by}`}>{item.by}</a> </span>
                        <span className="delete-item-time">
                          <a href={`/item?id=${item.id}`}>{renderCreatedTime(item.created)}</a>
                        </span>
                        <span> | </span>
                        <span className="delete-item-edit"><a href={`/edit-item?id=${item.id}`}>edit</a></span>
                        <span> | </span>
                        <span><a href="">delete</a></span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {
                  !item.url && item.text ?
                  <div className="delete-item-text-content">
                    <span dangerouslySetInnerHTML={{ __html: item.text }}></span>
                  </div> : null
                }
              </div>
              <div className="delete-item-confirm-msg">
                <span>Do you want to delete this item?</span>
              </div>
              <div className="delete-item-btns">
                <input
                  type="submit"
                  value="Yes"
                  className="delete-item-yes-btn"
                  onClick={this.submitDeleteItem}
                />
                <input
                  type="submit"
                  value="No"
                  onClick={this.goBackToOriginPage}
                />
              </div>
              {
                this.state.submitError ?
                <div className="delete-item-submit-error-msg">
                  <span>An error occurred.</span>
                </div> : null
              }
            </> :
            <div className="delete-item-error-msg">
              {
                this.props.getDataError ?
                <span>An error occurred.</span> : null
              }
              {
                this.state.notAllowedError ?
                <span>You can’t delete that item.</span> : null
              }
              {
                this.state.notFoundError ?
                <span>Item not found.</span> : null
              }
            </div>
          }
        </div>
      </div>
    )
  }
}
