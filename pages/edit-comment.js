import { Component } from "react"

import "../styles/pages/edit-comment.css"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import renderPointsString from "../utils/renderPointsString.js"
import renderCreatedTime from "../utils/renderCreatedTime.js"
import truncateItemTitle from "../utils/truncateItemTitle.js"

import getEditCommentPageData from "../api/comments/getEditCommentPageData.js"
import editComment from "../api/comments/editComment.js"

export default class extends Component {
  static async getInitialProps({ query, req }) {
    const apiResult = await getEditCommentPageData(query.id, req)

    return {
      comment: apiResult && apiResult.comment,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      getDataError: apiResult && apiResult.getDataError,
      notAllowedError: apiResult && apiResult.notAllowedError,
      notFoundError: apiResult && apiResult.notFoundError,
      goToString: `edit-comment?id=${query.id}`
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      notAllowedError: this.props.notAllowedError,
      notFoundError: this.props.notFoundError,
      commentInputValue: this.props.comment ? this.props.comment.textForEditing : "",
      loading: false,
      textRequiredError: false,
      textTooLongError: false,
      submitError: false
    }
  }

  setInitialTextareaHeight = () => {
    if (this.props.comment.textForEditing) {
      const numOfLines = this.props.comment.textForEditing.split(/\r\n|\r|\n/).length

      return numOfLines + 5
    } else {
      return 6
    }
  }

  updateCommentInputValue = (event) => {
    this.setState({commentInputValue: event.target.value})
  }

  submitEditComment = () => {
    if (this.state.loading) return

    if (!this.state.commentInputValue.trim()) {
      this.setState({
        textRequiredError: true,
        textTooLongError: false,
        submitError: false
      })
    } else if (this.state.commentInputValue.length > 5000) {
      this.setState({
        textRequiredError: false,
        textTooLongError: true,
        submitError: false
      })
    } else {
      this.setState({loading: true})

      const self = this

      editComment(this.props.comment.id, this.state.commentInputValue, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${self.props.goToString}`
        } else if (response.notAllowedError) {
          self.setState({notAllowedError: true})
        } else if (response.notFoundError) {
          self.setState({notFoundError: true})
        } else if (response.textRequiredError) {
          self.setState({
            loading: false,
            textRequiredError: true,
            textTooLongError: false,
            submitError: false
          })
        } else if (response.textTooLongError) {
          self.setState({
            loading: false,
            textRequiredError: false,
            textTooLongError: true,
            submitError: false
          })
        } else if (response.submitError || !response.success) {
          self.setState({
            loading: false,
            textRequiredError: false,
            textTooLongError: false,
            submitError: true
          })
        } else {
          window.location.href = `/comment?id=${self.props.comment.id}`
        }
      })
    }
  }

  render () {
    const comment = this.props.comment

    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Edit Comment | Hacker News"
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
          label="edit comment"
        />
        <div className="edit-comment-content-container">
          {
            !this.props.getDataError && !this.state.notAllowedError && !this.state.notFoundError ?
            <>
              <div className="edit-comment-top-section">
                <table>
                  <tbody>
                    <tr>
                      <td valign="top">
                        <div className="edit-comment-top-section-star">
                          <span>*</span>
                        </div>
                      </td>
                      <td>
                        <span className="edit-comment-top-section-points">
                          {comment.points.toLocaleString()} {renderPointsString(comment.points)}
                        </span>
                        <span> by <a href={`/user?id=${comment.by}`}>{comment.by}</a> </span>
                        <span>
                          <a href={`/comment?id=${comment.id}`}>{renderCreatedTime(comment.created)}</a>
                        </span>
                        <span> | </span>
                        <span className="edit-comment-top-section-parent">
                          <a href={comment.isParent ? `/item?id=${comment.parentItemId}` : `/comment?id=${comment.parentCommentId}`}>parent</a>
                        </span>
                        <span> | </span>
                        <span>
                          <a href={`/delete-comment?id=${comment.id}`}>delete</a>
                        </span>
                        <span> | </span>
                        <span className="edit-comment-top-section-article-title">
                          on: <a href={`/item?id=${comment.parentItemId}`}>{truncateItemTitle(comment.parentItemTitle)}</a>
                        </span>
                        <div className="edit-comment-content">
                          <span dangerouslySetInnerHTML={{ __html: comment.text }}></span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="edit-comment-input-box">
                <div className="edit-comment-input-box-label">text:</div>
                <textarea
                  type="text"
                  cols={60}
                  rows={this.setInitialTextareaHeight()}
                  value={this.state.commentInputValue}
                  onChange={this.updateCommentInputValue}
                />
                <span className="edit-comment-input-box-help"><a href="/formatdoc">help</a></span>
              </div>
              <div className="edit-comment-input-submit-btn">
                <input
                  type="submit"
                  value="update"
                  onClick={() => this.submitEditComment()}
                />
              </div>
              {
                this.state.textRequiredError ?
                <div className="edit-comment-submit-error-msg">
                  <span>Text is required.</span>
                </div> : null
              }
              {
                this.state.textTooLongError ?
                <div className="edit-comment-submit-error-msg">
                  <span>Text exceeds limit of 5,000 characters.</span>
                </div> : null
              }
              {
                this.state.submitError ?
                <div className="edit-comment-submit-error-msg">
                  <span>An error occurred.</span>
                </div> : null
              }
            </> :
            <div className="edit-comment-error-msg">
              {
                this.props.getDataError ?
                <span>An error occurred.</span> : null
              }
              {
                this.state.notAllowedError ?
                <span>You can’t edit that comment.</span> : null
              }
              {
                this.state.notFoundError ?
                <span>Comment not found.</span> : null
              }
            </div>
          }
        </div>
        <Footer />
      </div>
    )
  }
}
