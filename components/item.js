import { Component } from "react"

import "../styles/components/item.css"

import renderCreatedTime from "../utils/renderCreatedTime.js"

import upvoteItem from "../api/items/upvoteItem.js"
import unvoteItem from "../api/items/unvoteItem.js"
import favoriteItem from "../api/items/favoriteItem.js"
import unfavoriteItem from "../api/items/unfavoriteItem.js"
import hideItem from "../api/items/hideItem.js"
import unhideItem from "../api/items/unhideItem.js"
import addNewComment from "../api/comments/addNewComment.js"
import killItem from "../api/moderation/killItem.js"
import unkillItem from "../api/moderation/unkillItem.js"

export default class extends Component {
  constructor(props) {
    super(props)
    this.state = {
      item: this.props.item,
      commentInputValue: "",
      loading: false,
      commentTextRequiredError: false,
      commentTextTooLongError: false,
      commentSubmitError: false
    }
  }

  updateCommentInputValue = (event) => {
    this.setState({commentInputValue: event.target.value})
  }

  requestAddNewComment = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else if (!this.state.commentInputValue) {
      this.setState({
        commentTextRequiredError: true,
        commentTextTooLongError: false,
        commentSubmitError: false
      })
    } else if (this.state.commentInputValue.length > 5000) {
      this.setState({
        commentTextRequiredError: false,
        commentTextTooLongError: true,
        commentSubmitError: false
      })
    } else {
      this.setState({loading: true})

      const commentData = {
        parentItemId: this.state.item.id,
        isParent: true,
        parentCommentId: null,
        text: this.state.commentInputValue,
      }

      const self = this

      addNewComment(commentData, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else if (response.textRequiredError) {
          self.setState({
            loading: false,
            commentTextRequiredError: true,
            commentTextTooLongError: false,
            commentSubmitError: false
          })
        } else if (response.textTooLongError) {
          self.setState({
            loading: false,
            commentTextRequiredError: false,
            commentTextTooLongError: true,
            commentSubmitError: false
          })
        } else if (response.submitError || !response.success) {
          self.setState({
            loading: false,
            commentTextRequiredError: false,
            commentTextTooLongError: false,
            commentSubmitError: true
          })
        } else {
          window.location.href = ""
        }
      })
    }
  }

  requestUpvoteItem = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.item.votedOnByUser = true
      this.forceUpdate()

      const self = this

      upvoteItem(this.state.item.id, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestUnvoteItem = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.item.votedOnByUser = false
      this.forceUpdate()

      const self = this

      unvoteItem(this.state.item.id, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestFavoriteItem = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      const self = this

      favoriteItem(this.state.item.id, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else if (!response.success) {
          window.location.href = ""
        } else {
          window.location.href = `/favorites?id=${self.props.currUsername}`
        }
      })
    }
  }

  requestUnfavoriteItem = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      const self = this

      unfavoriteItem(this.state.item.id, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else if (!response.success) {
          window.location.href = ""
        } else {
          window.location.href = `/favorites?id=${self.props.currUsername}`
        }
      })
    }
  }

  requestHideItem = () => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.item.hiddenByUser = true
      this.forceUpdate()

      const self = this

      hideItem(this.state.item.id, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else if (!response.success) {
          window.location.href = ""
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestUnhideItem = () => {
    if (this.state.loading) return

    this.setState({loading: true})

    this.state.item.hiddenByUser = false
    this.forceUpdate()

    const self = this

    unhideItem(this.state.item.id, function(response) {
      if (response.authError) {
        window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
      } else if (!response.success) {
        window.location.href = ""
      } else {
        self.setState({loading: false})
      }
    })
  }

  requestKillItem = () => {
    if (this.state.loading) return

    this.setState({loading: true})

    killItem(this.state.item.id, function(response) {
      window.location.href = ""
    })
  }

  requestUnkillItem = () => {
    if (this.state.loading) return

    this.setState({loading: true})

    unkillItem(this.state.item.id, function(response) {
      window.location.href = ""
    })
  }

  render() {
    const item = this.state.item
    const currUsername = this.props.currUsername

    return (
      <div className="item-details">
        <table>
          <tbody>
            <tr>
              <td valign="top">
                {
                  item.by === currUsername ?
                  <div className="item-star">
                    <span>*</span>
                  </div> : null
                }
                {
                  item.by !== currUsername ?
                  <>
                    {
                      item.votedOnByUser || item.dead ?
                      <span className="item-upvote hide"></span> :
                      <span className="item-upvote" onClick={() => this.requestUpvoteItem()}></span>
                    }
                  </> : null
                }
              </td>
              <td>
                <span className="item-title">
                  <a href={item.url ? item.url : `/item?id=${item.id}`}>
                    {item.dead ? "[dead] " : null}
                    {item.title}
                  </a>
                </span>
                {
                  item.url ?
                  <span className="item-domain">(<a href={`/from?site=${item.domain}`}>{item.domain}</a>)</span> : null
                }
              </td>
            </tr>
            <tr className="item-details-bottom">
              <td colSpan="1"></td>
              <td>
                <span>{item.points.toLocaleString()} {item.points === 1 ? "point" : "points"}</span>
                <span> by <a href={`/user?id=${item.by}`}>{item.by}</a> </span>
                <span><a href={`/item?id=${item.id}`}>{renderCreatedTime(item.created)}</a> </span>
                {
                  item.votedOnByUser && !item.unvoteExpired && !item.dead ?
                  <>
                    <span> | </span>
                    <span className="item-unvote" onClick={() => this.requestUnvoteItem()}>un-vote</span>
                  </> : null
                }
                {
                  !item.hiddenByUser ?
                  <>
                    <span> | </span>
                    <span className="item-hide" onClick={() => this.requestHideItem()}>hide</span>
                  </> :
                  <>
                    <span> | </span>
                    <span className="item-hide" onClick={() => this.requestUnhideItem()}>un-hide</span>
                  </>
                }
                <span> | </span>
                <span><a href={`/search?q=${item.title}`}>past</a></span>
                <span> | </span>
                <span><a href={`https://www.google.com/search?q=${item.title}`}>web</a></span>
                {
                  !item.favoritedByUser ?
                  <>
                    <span> | </span>
                    <span className="item-favorite" onClick={() => this.requestFavoriteItem()}>favorite</span>
                  </> :
                  <>
                    <span> | </span>
                    <span className="item-favorite" onClick={() => this.requestUnfavoriteItem()}>un-favorite</span>
                  </>
                }
                {
                  item.by === currUsername && !item.editAndDeleteExpired && !item.dead ?
                  <>
                    <span> | </span>
                    <span className="item-edit">
                      <a href={`/edit-item?id=${item.id}`}>edit</a>
                    </span>
                  </> : null
                }
                {
                  item.by === currUsername && !item.editAndDeleteExpired && !item.dead ?
                  <>
                    <span> | </span>
                    <span className="item-delete">
                      <a href={`/delete-item?id=${item.id}&goto=${encodeURIComponent(this.props.goToString)}`}>delete</a>
                    </span>
                  </> : null
                }
                {
                  this.props.isModerator && !item.dead ?
                  <>
                    <span> | </span>
                    <span className="item-kill" onClick={() => this.requestKillItem()}>kill</span>
                  </> : null
                }
                {
                  this.props.isModerator && item.dead ?
                  <>
                    <span> | </span>
                    <span className="item-kill" onClick={() => this.requestUnkillItem()}>un-kill</span>
                  </> : null
                }
                {
                  !item.dead ?
                  <>
                    {
                      // item.commentCount > 0 ?
                      false ?
                      <>
                        <span> | </span>
                        <span className="item-comments">
                          <a href={`/item?id=${item.id}`}>{item.commentCount.toLocaleString()} comment{item.commentCount > 1 ? "s" : null}</a>
                        </span>
                      </> :
                      <>
                        <span> | </span>
                        <span className="item-comments">
                          <a href={`/item?id=${item.id}`}>discuss</a>
                        </span>
                      </>
                    }
                  </> : null
                }
              </td>
            </tr>
          </tbody>
        </table>
        {
          !item.url && item.text ?
          <div className="item-text-content">
            <span dangerouslySetInnerHTML={{ __html: item.text }}></span>
          </div> : null
        }
        {
          !item.dead ?
          <>
            <div className="item-comment-box">
              <textarea
                type="text"
                value={this.state.commentInputValue}
                onChange={this.updateCommentInputValue}
              />
            </div>
            <div className="item-add-comment-btn">
              <input
                type="submit"
                value="add comment"
                onClick={() => this.requestAddNewComment()}
              />
            </div>
            {
              this.state.commentTextTooLongError ?
              <div className="item-add-comment-error">
                <span>Text exceeds limit of 5,000 characters.</span>
              </div> : null
            }
            {
              this.state.commentTextRequiredError ?
              <div className="item-add-comment-error">
                <span>Text is required.</span>
              </div> : null
            }
            {
              this.state.commentSubmitError ?
              <div className="item-add-comment-error">
                <span>An error occurred.</span>
              </div> : null
            }
          </> : null
        }
      </div>
    )
  }
}
