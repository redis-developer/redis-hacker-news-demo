import { Component } from "react"

import "../styles/components/commentsList.css"

import upvoteComment from "../api/comments/upvoteComment.js"
import downvoteComment from "../api/comments/downvoteComment.js"
import unvoteComment from "../api/comments/unvoteComment.js"
import unfavoriteComment from "../api/comments/unfavoriteComment.js"
import killComment from "../api/moderation/killComment.js"
import unkillComment from "../api/moderation/unkillComment.js"

import renderPointsString from "../utils/renderPointsString.js"
import renderCreatedTime from "../utils/renderCreatedTime.js"
import truncateItemTitle from "../utils/truncateItemTitle.js"

export default class extends Component {
  constructor(props) {
    super(props)
    this.state = {
      comments: this.props.comments,
      loading: false
    }
  }

  requestUpvoteComment = (commentId, parentItemId, index) => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.comments[index].votedOnByUser = true
      this.forceUpdate()

      const self = this

      upvoteComment(commentId, parentItemId, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestDownvoteComment = (commentId, parentItemId, index) => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.comments[index].votedOnByUser = true
      this.forceUpdate()

      const self = this

      downvoteComment(commentId, parentItemId, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestUnvoteComment = (commentId, index) => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.comments[index].votedOnByUser = false
      this.forceUpdate()

      const self = this

      unvoteComment(commentId, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestUnfavoriteComment = (commentId) => {
    if (this.state.loading) return

    const self = this

    unfavoriteComment(commentId, function(response) {
      if (response.authError) {
        window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
      } else {
        window.location.href = ""
      }
    })
  }

  requestKillComment = (commentId) => {
    if (this.state.loading) return

    this.setState({loading: true})

    killComment(commentId, function(response) {
      window.location.href = ""
    })
  }

  requestUnkillComment = (commentId) => {
    if (this.state.loading) return

    this.setState({loading: true})

    unkillComment(commentId, function(response) {
      window.location.href = ""
    })
  }

  render() {
    const currUsername = this.props.currUsername

    return (
      <>
        {
          this.state.comments ?
          this.state.comments.map((comment, index) => {
            return (
              <div key={comment.id} className="listed-comment">
                <table>
                  <tbody>
                    <tr>
                      <td valign="top">
                        {
                          currUsername === comment.by ?
                          <div className="listed-comment-star">
                            <span>*</span>
                          </div> : null
                        }
                        {
                          currUsername !== comment.by ?
                          <>
                            {
                              comment.votedOnByUser || comment.dead ?
                              <>
                                <div className="listed-comment-upvote hide">
                                  <span></span>
                                </div>
                              </> :
                              <>
                                <div className="listed-comment-upvote" onClick={() => this.requestUpvoteComment(comment.id, comment.parentItemId, index)}>
                                  <span></span>
                                </div>
                              </>
                            }
                          </> : null
                        }
                        {
                          currUsername !== comment.by ?
                          <>
                            {
                              comment.votedOnByUser || !this.props.showDownvote || comment.dead ?
                              <>
                                <div className="listed-comment-downvote hide">
                                  <span></span>
                                </div>
                              </> :
                              <>
                                <div className="listed-comment-downvote" onClick={() => this.requestDownvoteComment(comment.id, comment.parentItemId, index)}>
                                  <span></span>
                                </div>
                              </>
                            }
                          </> : null
                        }
                      </td>
                      <td>
                        <div className="listed-comment-head">
                          {
                            currUsername === comment.by ?
                            <span>{comment.points.toLocaleString()} {renderPointsString(comment.points)} by </span> : null
                          }
                          <span>
                            <a href={`/user?id=${comment.by}`}>{comment.by} </a>
                          </span>
                          <span>
                            <a href={`/comment?id=${comment.id}`}>{renderCreatedTime(comment.created)}</a>
                          </span>
                          {
                            comment.dead ?
                            <span> [dead]</span> : null
                          }
                          {
                            comment.votedOnByUser && !comment.unvoteExpired ?
                            <>
                              <span> | </span>
                              <span className="listed-comment-unvote" onClick={() => this.requestUnvoteComment(comment.id, index)}>un-vote</span>
                            </> : null
                          }
                          <span> | </span>
                          <span className="listed-comment-parent">
                            <a href={comment.isParent ? `/item?id=${comment.parentItemId}` : `/comment?id=${comment.parentCommentId}`}>parent</a>
                          </span>
                          {
                            this.props.showUnfavoriteOption ?
                            <>
                              <span> | </span>
                              <span className="listed-comment-unfavorite" onClick={() => this.requestUnfavoriteComment(comment.id)}>un-favorite</span>
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
                              <span className="listed-comment-kill" onClick={() => this.requestKillComment(comment.id)}>kill</span>
                            </> : null
                          }
                          {
                            this.props.isModerator && comment.dead ?
                            <>
                              <span> | </span>
                              <span className="listed-comment-kill" onClick={() => this.requestUnkillComment(comment.id)}>un-kill</span>
                            </> : null
                          }
                          <span> | </span>
                          <span>
                            on: <a href={`/item?id=${comment.parentItemId}`}>{truncateItemTitle(comment.parentItemTitle)}</a>
                          </span>
                        </div>
                        <div className="listed-comment-text">
                          <span dangerouslySetInnerHTML={{ __html: comment.text }}></span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          }) : null
        }
        {
          this.props.isMore ?
          <div className="listed-comments-more">
            <a href={this.props.isMoreLink}>
              <span>More</span>
            </a>
          </div> : null
        }
      </>
    )
  }
}
