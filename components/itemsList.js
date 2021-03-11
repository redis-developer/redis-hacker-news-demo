import { Component } from "react"

import "../styles/components/itemsList.css"

import upvoteItem from "../api/items/upvoteItem.js"
import unvoteItem from "../api/items/unvoteItem.js"
import unfavoriteItem from "../api/items/unfavoriteItem.js"
import hideItem from "../api/items/hideItem.js"
import unhideItem from "../api/items/unhideItem.js"
import killItem from "../api/moderation/killItem.js"
import unkillItem from "../api/moderation/unkillItem.js"

import renderCreatedTime from "../utils/renderCreatedTime.js"

export default class extends Component {
  constructor(props) {
    super(props)
    this.state = {
      items: this.props.items,
      loading: false
    }
  }

  requestUpvoteItem = (itemId, itemIndexPosition) => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.items[itemIndexPosition].votedOnByUser = true
      this.forceUpdate()

      const self = this

      upvoteItem(itemId, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestUnvoteItem = (itemId, itemIndexPosition) => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      this.state.items[itemIndexPosition].votedOnByUser = false
      this.forceUpdate()

      const self = this

      unvoteItem(itemId, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestUnfavoriteItem = (itemId) => {
    if (this.state.loading) return

    const self = this

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      unfavoriteItem(itemId, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          window.location.href = ""
        }
      })
    }
  }

  requestHideItem = (itemId, itemIndexPosition) => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      for (let i=0; i < this.state.items.length; i++) {
        if (i > itemIndexPosition) {
          this.state.items[i].rank -= 1
        }
      }

      this.state.items.splice(itemIndexPosition, 1)
      this.forceUpdate()

      const self = this

      hideItem(itemId, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          self.setState({loading: false})
        }
      })
    }
  }

  requestUnhideItem = (itemId) => {
    if (this.state.loading) return

    if (!this.props.userSignedIn) {
      window.location.href = `/login?goto=${encodeURIComponent(this.props.goToString)}`
    } else {
      this.setState({loading: true})

      const self = this

      unhideItem(itemId, function(response) {
        if (response.authError) {
          window.location.href = `/login?goto=${encodeURIComponent(self.props.goToString)}`
        } else {
          window.location.href = ""
        }
      })
    }
  }

  requestKillItem = (itemId) => {
    if (this.state.loading) return

    this.setState({loading: true})

    killItem(itemId, function(response) {
      window.location.href = ""
    })
  }

  requestUnkillItem = (itemId) => {
    if (this.state.loading) return

    this.setState({loading: true})

    unkillItem(itemId, function(response) {
      window.location.href = ""
    })
  }

  render() {
    return (
      <>
        {
          this.state.items ?
          this.state.items.map((item, index) => {
            return (
              <div key={item.id} className="listed-item-container">
                <table>
                  <tbody>
                    <tr>
                      <td className={this.props.showRank ? "listed-item-rank" : "listed-item-rank hide"}>
                        {
                          this.props.showRank ?
                          <span>{item.rank}.</span> : null
                        }
                      </td>
                      <td valign="top">
                        {
                          this.props.currUsername === item.by ?
                          <div className="listed-item-star">
                            <span>*</span>
                          </div> : null
                        }
                        {
                          this.props.currUsername !== item.by ?
                          <>
                            {
                              item.votedOnByUser || item.dead ?
                              <span className="listed-item-upvote hide"></span> :
                              <span className="listed-item-upvote" onClick={() => this.requestUpvoteItem(item.id, index)}></span>
                            }
                          </> : null
                        }
                      </td>
                      <td>
                        <span className="listed-item-title">
                          <a href={item.url ? item.url : `/item?id=${item.id}`}>
                            {item.dead ? "[dead] " : null}
                            {item.title}
                          </a>
                        </span>
                        {
                          item.url ?
                          <span className="listed-item-domain">(<a href={`/from?site=${item.domain}`}>{item.domain}</a>)</span> : null
                        }
                      </td>
                    </tr>
                    <tr className="listed-item-bottom-section">
                      <td colSpan="2"></td>
                      <td>
                        <span>{item.points.toLocaleString()} {item.points === 1 ? "point" : "points"}</span>
                        <span> by <a href={`/user?id=${item.by}`}>{item.by}</a> </span>
                        <span className="listed-item-time"><a href={`/item?id=${item.id}`}>{renderCreatedTime(item.created)}</a> </span>
                        {
                          this.props.showPastLink ?
                          <>
                            <span> | </span>
                            <span><a href={`/search?q=${item.title}`}>past</a></span>
                          </> : null
                        }
                        {
                          this.props.showWebLink ?
                          <>
                            <span> | </span>
                            <span><a href={`https://www.google.com/search?q=${item.title}`}>web</a></span>
                          </> : null
                        }
                        {
                          item.votedOnByUser && !item.unvoteExpired && !item.dead ?
                          <>
                            <span> | </span>
                            <span className="listed-item-unvote" onClick={() => this.requestUnvoteItem(item.id, index)}>un-vote</span>
                          </> : null
                        }
                        {
                          this.props.showUnfavoriteOption ?
                          <>
                            <span> | </span>
                            <span className="listed-item-unfavorite" onClick={() => this.requestUnfavoriteItem(item.id)}>un-favorite</span>
                          </> : null
                        }
                        {
                          this.props.showHideOption ?
                          <>
                            <span> | </span>
                            <span className="listed-item-hide" onClick={() => this.requestHideItem(item.id, index)}>hide</span>
                          </> : null
                        }
                        {
                          this.props.showUnhideOption ?
                          <>
                            <span> | </span>
                            <span className="listed-item-unhide" onClick={() => this.requestUnhideItem(item.id)}>un-hide</span>
                          </> : null
                        }
                        {
                          item.by === this.props.currUsername && !item.editAndDeleteExpired && !item.dead ?
                          <>
                            <span> | </span>
                            <span>
                              <a href={`/edit-item?id=${item.id}`}>edit</a>
                            </span>
                          </> : null
                        }
                        {
                          item.by === this.props.currUsername && !item.editAndDeleteExpired && !item.dead ?
                          <>
                            <span> | </span>
                            <span>
                              <a href={`/delete-item?id=${item.id}&goto=${encodeURIComponent(this.props.goToString)}`}>delete</a>
                            </span>
                          </> : null
                        }
                        {
                          this.props.isModerator && !item.dead ?
                          <>
                            <span> | </span>
                            <span className="listed-item-kill" onClick={() => this.requestKillItem(item.id)}>kill</span>
                          </> : null
                        }
                        {
                          this.props.isModerator && item.dead ?
                          <>
                            <span> | </span>
                            <span className="listed-item-kill" onClick={() => this.requestUnkillItem(item.id)}>un-kill</span>
                          </> : null
                        }
                        {
                          !item.dead ?
                          <>
                            {
                              item.commentCount > 0 ?
                              <>
                                <span> | </span>
                                <span className="listed-item-comments">
                                  <a href={`/item?id=${item.id}`}>
                                    {item.commentCount.toLocaleString("en")} comment{item.commentCount > 1 ? "s" : null}
                                  </a>
                                </span>
                              </> :
                              <>
                                <span> | </span>
                                <span className="listed-item-comments"><a href={`/item?id=${item.id}`}>discuss</a></span>
                              </>
                            }
                          </> : null
                        }
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
          <div className={this.props.showRank ? "listed-item-more" : "listed-item-more hide-rank"}>
            <a href={this.props.isMoreLink}>
              <span>More</span>
            </a>
          </div> : null
        }
      </>
    )
  }
}
