import { Component } from "react"

import "../styles/pages/changepw.css"

import HeadMetadata from "../components/headMetadata.js"
import AlternateHeader from "../components/alternateHeader.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import authUser from "../api/users/authUser.js"
import changePassword from "../api/users/changePassword.js"

export default class extends Component {
  static async getInitialProps ({req, res, query}) {
    const authResult = await authUser(req)

    if (!authResult.success) {
      res.writeHead(302, {
        Location: "/login?goto=changepw"
      })

      res.end()
    }

    return {
      userContainsEmail: authResult.authUser.containsEmail,
      username: authResult.authUser.username
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      currentInputValue: "",
      newInputValue: "",
      loading: false,
      invalidCurrentPassword: false,
      newPasswordLengthError: false,
      submitError: false
    }
  }

  updateCurrentInputValue = (event) => {
    this.setState({currentInputValue: event.target.value})
  }

  updateNewInputValue = (event) => {
    this.setState({newInputValue: event.target.value})
  }

  submitRequest = () => {
    if (this.state.loading) return

    const currentPassword = this.state.currentInputValue
    const newPassword = this.state.newInputValue

    if (!currentPassword) {
      this.setState({
        invalidCurrentPassword: true,
        newPasswordLengthError: false,
        submitError: false
      })
    } else if (newPassword.length < 8) {
      this.setState({
        invalidCurrentPassword: false,
        newPasswordLengthError: true,
        submitError: false
      })
    } else {
      this.setState({loading: true})

      const self = this

      changePassword(currentPassword, newPassword, function(response) {
        if (response.authError) {
          window.location.href = "/login?goto=changepw"
        } else if (response.newPasswordLengthError) {
          self.setState({
            loading: false,
            invalidCurrentPassword: false,
            newPasswordLengthError: true,
            submitError: false
          })
        } else if (response.invalidCurrentPassword) {
          self.setState({
            loading: false,
            invalidCurrentPassword: true,
            newPasswordLengthError: false,
            submitError: false
          })
        } else if (response.submitError || !response.success) {
          self.setState({
            loading: false,
            invalidCurrentPassword: false,
            newPasswordLengthError: false,
            submitError: true
          })
        } else {
          window.location.href = "/login"
        }
      })
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Change Password | Hacker News"
        />
        <GoogleAnalytics />
        <AlternateHeader
          displayMessage={`Change Password for ${this.props.username}`}
        />
        <div className="changepw-content-container">
          {
            !this.props.userContainsEmail ?
            <div className="changepw-error-msg">
              <span>First, please put a valid email address in your <a href={`/user?id=${this.props.username}`}>profile</a>. Otherwise you could lose your account if you mistype your new password.</span>
            </div> : null
          }
          {
            this.state.invalidCurrentPassword ?
            <div className="changepw-error-msg">
              <span>Invalid current password.</span>
            </div> : null
          }
          {
            this.state.newPasswordLengthError ?
            <div className="changepw-error-msg">
              <span>Passwords should be at least 8 characters.</span>
            </div> : null
          }
          {
            this.state.submitError ?
            <div className="changepw-error-msg">
              <span>An error occurred.</span>
            </div> : null
          }
          <div className="changepw-input-item">
            <div className="changepw-input-item-label">
              <span>Current Password:</span>
            </div>
            <div className="changepw-input-item-input">
              <input
                type="password"
                value={this.state.currentInputValue}
                onChange={this.updateCurrentInputValue}
              />
            </div>
          </div>
          <div className="changepw-input-item">
            <div className="changepw-input-item-label">
              <span>New Password:</span>
            </div>
            <div className="changepw-input-item-input">
              <input
                type="password"
                value={this.state.newInputValue}
                onChange={this.updateNewInputValue}
              />
            </div>
          </div>
          <div className="changepw-submit-btn">
            <input
              type="submit"
              value="Change"
              onClick={() => this.submitRequest()}
            />
          </div>
        </div>
      </div>
    )
  }
}
