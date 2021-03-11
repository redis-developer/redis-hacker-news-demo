import { Component } from "react"
import moment from "moment"

import "../styles/pages/user.css"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getUserData from "../api/users/getUserData.js"
import updateUserData from "../api/users/updateUserData.js"
import addUserShadowBan from "../api/moderation/addUserShadowBan.js"
import removeUserShadowBan from "../api/moderation/removeUserShadowBan.js"
import addUserBan from "../api/moderation/addUserBan.js"
import removeUserBan from "../api/moderation/removeUserBan.js"

export default class extends Component {
  static async getInitialProps ({ req, query }) {
    const apiResult = await getUserData(query.id, req)

    return {
      username: query.id,
      userData: apiResult && apiResult.user,
      showPrivateUserData: apiResult && apiResult.showPrivateUserData,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      getDataError: apiResult && apiResult.getDataError,
      notFoundError: apiResult && apiResult.notFoundError,
      goToString: `user?id=${query.id}`
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      aboutInputValue: this.props.userData ? this.props.userData.about : "",
      emailInputValue:  this.props.userData ? this.props.userData.email : "",
      showDeadValue: this.props.userData && this.props.userData.showDead ? "yes" : "no",
      loading: false,
      submitError: false
    }
  }

  setInitialTextareaHeight = () => {
    if (this.props.userData.about) {
      const numOfLines = this.props.userData.about.split(/\r\n|\r|\n/).length

      return numOfLines + 3
    } else {
      return 6
    }
  }

  updateAboutInputValue = (event) => {
    this.setState({aboutInputValue: event.target.value})
  }

  updateEmailInputValue = (event) => {
    this.setState({emailInputValue: event.target.value})
  }

  updateShowDeadValue = (event) => {
    this.setState({showDeadValue: event.target.value})
  }

  submitUpdateRequest = () => {
    if (this.state.loading) return

    this.setState({loading: true})

    const inputData = {
      about: this.state.aboutInputValue,
      email: this.state.emailInputValue,
      showDead: this.state.showDeadValue === "yes" ? true : false
    }

    const self = this

    updateUserData(inputData, function(response) {
      if (response.submitError) {
        self.setState({
          loading: false,
          submitError: true
        })
      } else {
        window.location.href = ""
      }
    })
  }

  requestAddShadowBan = () => {
    if (this.state.loading) return

    this.setState({loading: true})

    addUserShadowBan(this.props.username, function(response) {
      window.location.href = ""
    })
  }

  requestRemoveShadowBan = () => {
    if (this.state.loading) return

    this.setState({loading: true})

    removeUserShadowBan(this.props.username, function(response) {
      window.location.href = ""
    })
  }

  requestAddUserBan = () => {
    if (this.state.loading) return

    this.setState({loading: true})

    addUserBan(this.props.username, function(response) {
      window.location.href = ""
    })
  }

  requestRemoveUserBan = () => {
    if (this.state.loading) return

    this.setState({loading: true})

    removeUserBan(this.props.username, function(response) {
      window.location.href = ""
    })
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title={this.props.userData ? `Profile: ${this.props.username} | Hacker News` : "User Profile | Hacker News"}
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
        />
        <div className="user-content-container">
          {
            !this.props.getDataError && !this.props.notFoundError ?
            <>
              {
                this.props.showPrivateUserData ?
                <div className="user-private-data">
                  {
                    !this.props.userData.email ?
                    <div className="user-add-email-address-msg">
                      <span>Please put a valid address in the email field, or we won't be able to send you a new password if you forget yours. Your address is only visible to you and us. Crawlers and other users can't see it.</span>
                    </div> : null
                  }
                  <div className="user-item">
                    <div className="user-item-label">
                      <span>user:</span>
                    </div>
                    <div className="user-item-content username">
                      <span>{this.props.userData.username}</span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label">
                      <span>created:</span>
                    </div>
                    <div className="user-item-content created">
                      <span>{moment.unix(this.props.userData.created).format("MMM D, YYYY")}</span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label">
                      <span>karma:</span>
                    </div>
                    <div className="user-item-content karma">
                      <span>{this.props.userData.karma.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label about">
                      <span>about:</span>
                    </div>
                    <div className="user-item-content about">
                      <textarea
                        cols={60}
                        rows={this.setInitialTextareaHeight()}
                        wrap="virtual"
                        type="text"
                        value={this.state.aboutInputValue}
                        onChange={this.updateAboutInputValue}
                      />
                      <span className="user-item-about-help"><a href="/formatdoc">help</a></span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label">
                      <span>email:</span>
                    </div>
                    <div className="user-item-content email">
                      <input
                        type="text"
                        value={this.state.emailInputValue}
                        onChange={this.updateEmailInputValue}
                      />
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label">
                      <span>showdead:</span>
                    </div>
                    <div className="user-item-content email">
                      <select value={this.state.showDeadValue} onChange={this.updateShowDeadValue}>
                        <option value="no">no</option>
                        <option value="yes">yes</option>
                      </select>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label">
                      <span></span>
                    </div>
                    <div className="user-item-content">
                      <span><a href="/changepw">change password</a></span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label">
                      <span></span>
                    </div>
                    <div className="user-item-content">
                      <span><a href={`/submitted?id=${this.props.username}`}>submissions</a></span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label">
                      <span></span>
                    </div>
                    <div className="user-item-content">
                      <span><a href={`/threads?id=${this.props.username}`}>comments</a></span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label">
                      <span></span>
                    </div>
                    <div className="user-item-content">
                      <span><a href={`/hidden`}>hidden</a></span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label">
                      <span></span>
                    </div>
                    <div className="user-item-content">
                      <span><a href={`/upvoted?id=${this.props.username}`}>upvoted items</a></span>
                      <span> / </span>
                      <span><a href={`/upvoted?id=${this.props.username}&comments=t`}>comments</a></span>
                      <span> <i>(private)</i></span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label">
                      <span></span>
                    </div>
                    <div className="user-item-content">
                      <span><a href={`/favorites?id=${this.props.username}`}>favorite items</a></span>
                      <span> / </span>
                      <span><a href={`/favorites?id=${this.props.username}&comments=t`}>comments</a></span>
                      <span> <i>(shared)</i></span>
                    </div>
                  </div>
                  <div className="user-submit-btn">
                    <input
                      type="submit"
                      value="update"
                      onClick={() => this.submitUpdateRequest()}
                    />
                  </div>
                  {
                    this.state.submitError ?
                    <div className="user-submit-error-msg">
                      <span>An error occurred.</span>
                    </div> : null
                  }
                </div> :
                <div className="user-public-data">
                  <div className="user-item">
                    <div className="user-item-label public">
                      <span>user:</span>
                    </div>
                    <div className="user-item-content username">
                      <span>{this.props.userData.username}</span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label public">
                      <span>created:</span>
                    </div>
                    <div className="user-item-content created">
                      <span>{moment.unix(this.props.userData.created).format("MMM D, YYYY")}</span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label public">
                      <span>karma:</span>
                    </div>
                    <div className="user-item-content karma">
                      <span>{this.props.userData.karma.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label about public">
                      <span>about:</span>
                    </div>
                    <div className="user-item-content about public">
                      <span dangerouslySetInnerHTML={{ __html: this.props.userData.about }}></span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label public">
                      <span></span>
                    </div>
                    <div className="user-item-content">
                      <span><a href={`/submitted?id=${this.props.username}`}>submissions</a></span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label public">
                      <span></span>
                    </div>
                    <div className="user-item-content">
                      <span><a href={`/threads?id=${this.props.username}`}>comments</a></span>
                    </div>
                  </div>
                  <div className="user-item">
                    <div className="user-item-label public">
                      <span></span>
                    </div>
                    <div className="user-item-content">
                      <span><a href={`/favorites?id=${this.props.username}`}>favorites</a></span>
                    </div>
                  </div>
                  {
                    this.props.authUserData.isModerator ?
                    <div className="user-moderator-section">
                      {
                        !this.props.userData.shadowBanned ?
                        <div className="user-item moderator-section">
                          <div className="user-item-content">
                            <span className="user-item-ban-btn" onClick={() => this.requestAddShadowBan()}>Shadow-Ban</span>
                            <span> (User item and comment submissions get automatically killed)</span>
                          </div>
                        </div> :
                        <div className="user-item">
                          <div className="user-item-content">
                            <span>Shadow-Banned (</span>
                            <span className="user-item-ban-btn" onClick={() => this.requestRemoveShadowBan()}>Remove</span>
                            <span>)</span>
                          </div>
                        </div>
                      }
                      {
                        !this.props.userData.banned ?
                        <div className="user-item moderator-section">
                          <div className="user-item-content">
                            <span className="user-item-ban-btn" onClick={() => this.requestAddUserBan()}>Ban</span>
                            <span> (User login and authentication will be revoked)</span>
                          </div>
                        </div> :
                        <div className="user-item">
                          <div className="user-item-content">
                            <span>Banned (</span>
                            <span className="user-item-ban-btn" onClick={() => this.requestRemoveUserBan()}>Remove</span>
                            <span>)</span>
                          </div>
                        </div>
                      }
                    </div> : null
                  }
                </div>
              }
            </> :
            <div className="user-get-data-error-msg">
              {
                this.props.notFoundError ?
                <span>User not found.</span> :
                <span>An error occurred.</span>
              }
            </div>
          }
        </div>
        <Footer />
      </div>
    )
  }
}
