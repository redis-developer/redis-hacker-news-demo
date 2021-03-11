import { Component } from "react"

import "../styles/pages/reset.css"

import HeadMetadata from "../components/headMetadata.js"
import AlternateHeader from "../components/alternateHeader.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import resetPassword from "../api/users/resetPassword.js"

export default class extends Component {
  static async getInitialProps ({query}) {
    return {
      resetToken: query.token,
      username: query.username
    }
  }

  constructor() {
    super()
    this.state = {
      passwordInputValue: "",
      passwordLengthError: false,
      expiredTokenError: false,
      invalidTokenError: false,
      submitError: false,
      loading: false
    }
  }

  updatePasswordInputValue = (event) => {
    this.setState({passwordInputValue: event.target.value})
  }

  submitRequest = () => {
    if (this.state.loading) return

    if (this.state.passwordInputValue.length < 8) {
      this.setState({
        passwordLengthError: true,
        expiredTokenError: false,
        invalidTokenError: false,
        submitError: false
      })
    } else {
      this.setState({loading: true})

      const self = this

      resetPassword(this.props.username, this.state.passwordInputValue, this.props.resetToken, function(response) {
        if (response.invalidTokenError) {
          self.setState({
            loading: false,
            passwordLengthError: false,
            expiredTokenError: false,
            invalidTokenError: true,
            submitError: false
          })
        } else if (response.expiredTokenError) {
          self.setState({
            loading: false,
            passwordLengthError: false,
            expiredTokenError: true,
            invalidTokenError: false,
            submitError: false
          })
        } else if (response.passwordLengthError) {
          self.setState({
            loading: false,
            passwordLengthError: true,
            expiredTokenError: false,
            invalidTokenError: false,
            submitError: false
          })
        } else if (response.submitError || !response.success) {
          self.setState({
            loading: false,
            passwordLengthError: false,
            expiredTokenError: false,
            invalidTokenError: false,
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
          title="Reset Password | Hacker News"
        />
        <GoogleAnalytics />
        <AlternateHeader
          displayMessage="Reset Password"
        />
        <div className="reset-password-content-container">
          {
            this.state.passwordLengthError ?
            <div className="reset-password-error-msg">
              <span>Passwords should be at least 8 characters.</span>
            </div> : null
          }
          {
            this.state.expiredTokenError ?
            <div className="reset-password-error-msg">
              <span>Reset token has expired.</span>
            </div> : null
          }
          {
            this.state.invalidTokenError ?
            <div className="reset-password-error-msg">
              <span>Reset token is invalid.</span>
            </div> : null
          }
          {
            this.state.submitError ?
            <div className="reset-password-error-msg">
              <span>An error occurred.</span>
            </div> : null
          }
          <div className="reset-password-input-item">
            <div className="reset-password-input-item-label">
              <span>New Password:</span>
            </div>
            <div className="reset-password-input-item-input">
              <input
                type="password"
                value={this.state.passwordInputValue}
                onChange={this.updatePasswordInputValue}
              />
            </div>
          </div>
          <div className="reset-password-submit-btn">
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
