import { Component } from "react"

import "../styles/pages/login.css"

import HeadMetadata from "../components/headMetadata.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import loginUser from "../api/users/loginUser.js"
import authUser from "../api/users/authUser.js"
import removeUserCookieData from "../api/users/removeUserCookieData.js"

export default class extends Component {
  static async getInitialProps ({req, res, query}) {
    const authResult = await authUser(req)

    if (authResult.success) {
      res.writeHead(302, {
        Location: "/"
      })

      res.end()
    }

    return {
      goto: query.goto ? decodeURIComponent(query.goto) : ""
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      loading: false,

      // login
      loginUsernameInputValue: "",
      loginPasswordInputValue: "",
      loginCredentialError: false,
      loginSubmitError: false,
      bannedError: false,
    }
  }

  componentDidMount() {
    removeUserCookieData()
  }

  updateLoginUsernameInputValue = (event) => {
    this.setState({loginUsernameInputValue: event.target.value})
  }

  updateLoginPasswordInputValue = (event) => {
    this.setState({loginPasswordInputValue: event.target.value})
  }

  submitLogin = () => {
    if (this.state.loading) return

    const username = this.state.loginUsernameInputValue
    const password = this.state.loginPasswordInputValue

    if (username.length === 0 || password.length === 0) {
      this.setState({
        loginCredentialError: true,
        loginSubmitError: false,
        bannedError: false
      })
    } else {
      this.setState({loading: true})

      const self = this

      loginUser(username, password, function(response) {
        if (response.credentialError) {
          self.setState({
            loading: false,
            loginCredentialError: true,
            loginSubmitError: false,
            bannedError: false
          })
        } else if (response.bannedError) {
          self.setState({
            loading: false,
            loginCredentialError: false,
            loginSubmitError: false,
            bannedError: true
          })
        } else if (response.submitError || !response.success) {
          self.setState({
            loading: false,
            loginCredentialError: false,
            loginSubmitError: true,
            bannedError: false
          })
        } else {
          window.location.href = `/${self.props.goto}`
        }
      })
    }
  }

  render() {
    return (
      <section className="login-section">
        <HeadMetadata
          title="Login | Hacker News"
        />
        <GoogleAnalytics />
        <div className="login-wrapper">
          <div className="login-logo">
            <img src="/android-chrome-192x192.png"/>
          </div>
          <div className="login-title">
            <h1>Login</h1>
          </div>
          { this.state.loginCredentialError ? <div className="login-error-msg">Bad login.</div> : null }
          { this.state.loginSubmitError ? <div className="login-error-msg">An error occurred.</div> : null }
          { this.state.bannedError ? <div className="login-error-msg">User is banned.</div> : null }
          <div className="login-form-input">
            <input
              type="text"
              value={this.state.loginUsernameInputValue}
              onChange={this.updateLoginUsernameInputValue}
              placeholder="Username"
            />
          </div>
          <div className="login-form-input">
            <input
              type="password"
              value={this.state.loginPasswordInputValue}
              onChange={this.updateLoginPasswordInputValue}
              placeholder="Password"
            />
          </div>
          <div className="login-form-submit">
            <input
              type="submit"
              value="Login"
              onClick={() => this.submitLogin()}
            />
          </div>
          <div className="login-forgot-psw">
            <a href="/sign-up">Create a new account</a>
          </div>
          <div className="login-forgot-psw">
            <a href="/forgot">Forgot your Password?</a>
          </div>
        </div>
      </section>
    )
  }
}
