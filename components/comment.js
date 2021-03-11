import { Component } from "react"

import "../styles/components/comment.css"

import renderPointsString from "../utils/renderPointsString.js"
import renderCreatedTime from "../utils/renderCreatedTime.js"
import truncateItemTitle from "../utils/truncateItemTitle.js"

import addNewComment from "../api/comments/addNewComment.js"
import upvoteComment from "../api/comments/upvoteComment.js"
import downvoteComment from "../api/comments/downvoteComment.js"
import unvoteComment from "../api/comments/unvoteComment.js"
import favoriteComment from "../api/comments/favoriteComment.js"
import unfavoriteComment from "../api/comments/unfavoriteComment.js"
import killComment from "../api/moderation/killComment.js"
import unkillComment from "../api/moderation/unkillComment.js"

export default class extends Component {
  constructor(props) {
    super(props)
    this.state = {
      comment: this.props.comment,
      replyInputValue: "",
      loading: false,
      replyTextRequiredError: false,
      replyTextTooLongError: false,
      replySubmitError: false
    }
  }

  updateReplyInputValue = (event) => {
    this.setState({replyInputValue: event.target.value})
  }

  requestSubmitReply = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else if (!this.state.replyInputValue) {
      this.setState({
        replyTextRequiredError: true,
        replyTextTooLongError: false,
        replySubmitError: false
      })
    } else if (this.state.replyInputValue.length > 5000) {
      this.setState({
        replyTextRequiredError: false,
        replyTextTooLongError: true,
        replySubmitError: false
      })
    } else {
      this.setState({loading: true})

      const commentData = {
        parentItemId: this.props.comment.parentItemId,
        isParent: false,
        parentCommentId: this.props.comment.id,
        text: this.state.replyInputValue
      }

      const self = this

      addNewComment(commentData, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else if (response.textRequiredError) {
          self.setState({
            loading: false,
            replyTextRequiredError: true,
            replyTextTooLongError: false,
            replySubmitError: false
          })
        } else if (response.textTooLongError) {
          self.setState({
            loading: false,
            replyTextRequiredError: false,
            replyTextTooLongError: true,
            replySubmitError: false
          })
        } else if (response.submitError || !response.success) {
          self.setState({
            loading: false,
            replyTextRequiredError: false,
            replyTextTooLongError: false,
            replySubmitError: true
          })
        } else {
          window.location.href = `/comment?id=${self.props.comment.id}`
        }
      })
    }
  }

  requestUpvoteComment = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.comment.votedOnByUser = true
      this.forceUpdate()

      const self = this

      upvoteComment(this.state.comment.id, this.state.comment.parentItemId, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestDownvoteComment = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.comment.votedOnByUser = true
      this.forceUpdate()

      const self = this

      downvoteComment(this.state.comment.id, this.state.comment.parentItemId, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestUnvoteComment = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.comment.votedOnByUser = false
      this.forceUpdate()

      const self = this

      unvoteComment(this.state.comment.id, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestFavoriteComment = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      const self = this

      favoriteComment(this.state.comment.id, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          window.location.href = `/favorites?id=${self.props.currUsername}&comments=t`
        }
      })
    }
  }

  requestUnfavoriteComment = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.comment.favoritedByUser = false
      this.forceUpdate()

      const self = this

      unfavoriteComment(this.state.comment.id, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestKillComment = () => {
    if (this.state.loading) return

    this.setState({loading: true})

    killComment(this.state.comment.id, function(response) {
      window.location.href = ""
    })
  }

  requestUnkillComment = () => {
    if (this.state.loading) return

    this.setState({loading: true})

    unkillComment(this.state.comment.id, function(response) {
      window.location.href = ""
    })
  }

  render () {
    const comment = this.state.comment
    const currUsername = this.props.currUsername

    return (
      <div className="comment-content">
        <table>
          <tbody>
            <tr>
              <td valign="top">
                {
                  comment.by === currUsername ?
                  <div className="comment-content-star">
                    <span>*</span>
                  </div> : null
                }
                {
                  comment.by !== currUsername ?
                  <>
                    {
                      comment.votedOnByUser || comment.dead ?
                      <>
                        <div className="comment-content-upvote hide">
                          <span></span>
                        </div>
                      </> :
                      <>
                        <div className="comment-content-upvote" onClick={() => this.requestUpvoteComment()}>
                          <span></span>
                        </div>
                      </>
                    }
                  </> : null
                }
                {
                  comment.by !== currUsername ?
                  <>
                    {
                      comment.votedOnByUser || comment.dead || !this.props.showDownvote ?
                      <>
                        <div className="comment-content-downvote hide">
                          <span></span>
                        </div>
                      </> :
                      <>
                        <div className="comment-content-downvote" onClick={() => this.requestDownvoteComment()}>
                          <span></span>
                        </div>
                      </>
                    }
                  </> : null
                }
              </td>
              <td>
                <div className="comment-content-details">
                  {
                    currUsername === comment.by ?
                    <span>{comment.points.toLocaleString()} {renderPointsString(comment.points)} by </span> : null
                  }
                  <span className="comment-content-author">
                    <a href={`/user?id=${comment.by}`}>{comment.by}</a>
                  </span>
                  <span className="comment-content-time">
                    <a href={`/comment?id=${comment.id}`}>{renderCreatedTime(comment.created)}</a>
                  </span>
                  {
                    comment.dead ?
                    <span className="comment-content-dead"> [dead]</span> : null
                  }
                  {
                    comment.votedOnByUser && !comment.unvoteExpired && !comment.dead ?
                    <>
                      <span> | </span>
                      <span className="comment-content-unvote" onClick={() => this.requestUnvoteComment()}>un-vote</span>
                    </> : null
                  }
                  <span> | </span>
                  <span className="comment-content-parent">
                    <a href={comment.isParent ? `/item?id=${comment.parentItemId}` : `/comment?id=${comment.parentCommentId}`}>parent</a>
                  </span>
                  {
                    this.props.showFavoriteOption ?
                    <>
                      {
                        comment.favoritedByUser ?
                        <>
                          <span> | </span>
                          <span className="comment-content-favorite" onClick={() => this.requestUnfavoriteComment()}>un-favorite</span>
                        </> :
                        <>
                          <span> | </span>
                          <span className="comment-content-favorite" onClick={() => this.requestFavoriteComment()}>favorite</span>
                        </>
                      }
                    </> : null
                  }
                  {
                    comment.by === currUsername && !comment.editAndDeleteExpired && !comment.dead ?
                    <>
                      <span> | </span>
                      <span>
                        <a href={`/edit-comment?id=${comment.id}`}>edit</a>
                      </span>
                    </> : null
                  }
                  {
                    comment.by === currUsername && !comment.editAndDeleteExpired && !comment.dead ?
                    <>
                      <span> | </span>
                      <span>
                        <a href={`/delete-comment?id=${comment.id}&goto=${encodeURIComponent(this.props.goToString)}`}>delete</a>
                      </span>
                    </> : null
                  }
                  {
                    this.props.isModerator && !comment.dead ?
                    <>
                      <span> | </span>
                      <span className="comment-content-kill" onClick={() => this.requestKillComment()}>kill</span>
                    </> : null
                  }
                  {
                    this.props.isModerator && comment.dead ?
                    <>
                      <span> | </span>
                      <span className="comment-content-kill" onClick={() => this.requestUnkillComment()}>un-kill</span>
                    </> : null
                  }
                  <span> | </span>
                  <span>
                    on: <a href={`/item?id=${comment.parentItemId}`}>{truncateItemTitle(comment.parentItemTitle)}</a>
                  </span>
                </div>
                <div className="comment-content-text">
                  <span dangerouslySetInnerHTML={{ __html: comment.text }}></span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        {
          !comment.dead ?
          <>
            <div className="comment-content-repy-box">
              <textarea
                type="text"
                value={this.state.replyInputValue}
                onChange={this.updateReplyInputValue}
              />
            </div>
            <div className="comment-content-reply-btn">
              <input
                type="submit"
                value="reply"
                onClick={() => this.requestSubmitReply()}
              />
            </div>
            {
              this.state.replyTextRequiredError ?
              <div className="comment-content-reply-error-msg">
                <span>Text is required.</span>
              </div> : null
            }
            {
              this.state.replyTextTooLongError ?
              <div className="comment-content-reply-error-msg">
                <span>Text exceeds limit of 5,000 characters.</span>
              </div> : null
            }
            {
              this.state.replySubmitError ?
              <div className="comment-content-reply-error-msg">
                <span>An error occurred.</span>
              </div> : null
            }
          </> : null
        }
      </div>
    )
  }
}
