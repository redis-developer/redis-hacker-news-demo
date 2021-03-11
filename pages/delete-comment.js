import { Component } from "react"

import "../styles/pages/delete-comment.css"

import AlternateHeader from "../components/alternateHeader.js"
import HeadMetadata from "../components/headMetadata.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import renderPointsString from "../utils/renderPointsString.js"
import renderCreatedTime from "../utils/renderCreatedTime.js"
import truncateItemTitle from "../utils/truncateItemTitle.js"

import getDeleteCommentPageData from "../api/comments/getDeleteCommentPageData.js"
import deleteComment from "../api/comments/deleteComment.js"

export default class extends Component {
  static async getInitialProps({ query, req }) {
    const apiResult = await getDeleteCommentPageData(query.id, req)

    return {
      comment: apiResult && apiResult.comment,
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

  submitDeleteComment = () => {
    if (this.state.loading) return

    const self = this

    deleteComment(this.props.comment.id, function(response) {
      if (response.notAllowedError) {
        self.setState({
          loading: false,
          notAllowedError: true,
          submitError: false
        })
      } else if (response.submitError || !response.success) {
        self.setState({
          loading: false,
          notAllowedError: false,
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
    const comment = this.props.comment

    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Delete Comment | Hacker News"
        />
        <GoogleAnalytics />
        <AlternateHeader
          displayMessage="Delete Comment"
        />
        <div className="delete-comment-content-container">
          {
            !this.props.getDataError && !this.state.notAllowedError && !this.state.notFoundError ?
            <>
              <div className="delete-comment-top-section">
                <table>
                  <tbody>
                    <tr>
                      <td valign="top">
                        <div className="delete-comment-top-section-star">
                          <span>*</span>
                        </div>
                      </td>
                      <td>
                        <span className="delete-comment-top-section-points">
                          {comment.points.toLocaleString()} {renderPointsString(comment.points)}
                        </span>
                        <span> by <a href={`/user?id=${comment.by}`}>{comment.by}</a> </span>
                        <span>
                          <a href={`/comment?id=${comment.id}`}>{renderCreatedTime(comment.created)}</a>
                        </span>
                        <span> | </span>
                        <span className="delete-comment-top-section-parent">
                          <a href={comment.isParent ? `/item?id=${comment.parentItemId}` : `/comment?id=${comment.parentCommentId}`}>parent</a>
                        </span>
                        <span> | </span>
                        <span>
                          <a href={`/edit-comment?id=${comment.id}`}>edit</a>
                        </span>
                        <span> | </span>
                        <span className="delete-comment-top-section-article-title">
                          on: <a href={`/item?id=${comment.parentItemId}`}>{truncateItemTitle(comment.parentItemTitle)}</a>
                        </span>
                        <div className="delete-comment-content-text">
                          <span dangerouslySetInnerHTML={{ __html: comment.text }}></span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="delete-comment-confirm-msg">
                <span>Do you want to delete this comment?</span>
              </div>
              <div className="delete-comment-btns">
                <input
                  type="submit"
                  value="Yes"
                  className="delete-comment-yes-btn"
                  onClick={this.submitDeleteComment}
                />
                <input
                  type="submit"
                  value="No"
                  onClick={this.goBackToOriginPage}
                />
              </div>
              {
                this.state.submitError ?
                <div className="delete-comment-submit-error-msg">
                  <span>An error occurred.</span>
                </div> : null
              }
            </> :
            <div className="delete-comment-error-msg">
              {
                this.props.getDataError ?
                <span>An error occurred.</span> : null
              }
              {
                this.state.notAllowedError ?
                <span>You can’t delete that comment.</span> : null
              }
              {
                this.state.notFoundError ?
                <span>Comment not found.</span> : null
              }
            </div>
          }
        </div>
      </div>
    )
  }
}
