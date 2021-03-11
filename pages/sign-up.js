import { Component } from "react"

import "../styles/pages/sign-up.css"

import HeadMetadata from "../components/headMetadata.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import createNewUser from "../api/users/createNewUser.js"
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

      //create account
      createAccountUsernameInputValue: "",
      createAcountPasswordInputValue: "",
      createAccountUsernameExistsError: false,
      createAccountUsernameLengthError: false,
      createAccountPasswordLengthError: false,
      createAccountSubmitError: false
    }
  }

  componentDidMount() {
    removeUserCookieData()
  }

  updateCreateAccountUsernameInputValue = (event) => {
    this.setState({createAccountUsernameInputValue: event.target.value})
  }

  updateCreateAccountPasswordInputValue = (event) => {
    this.setState({createAcountPasswordInputValue: event.target.value})
  }

  submitCreateAccount = () => {
    if (this.state.loading) return

    const username = this.state.createAccountUsernameInputValue
    const password = this.state.createAcountPasswordInputValue

    if (username.length < 2 || username.length > 15) {
      this.setState({
        createAccountUsernameExistsError: false,
        createAccountUsernameLengthError: true,
        createAccountPasswordLengthError: false,
        createAccountSubmitError: false
      })
    } else if (password.length < 8) {
      this.setState({
        createAccountUsernameExistsError: false,
        createAccountUsernameLengthError: false,
        createAccountPasswordLengthError: true,
        createAccountSubmitError: false
      })
    } else {
      this.setState({loading: true})

      const self = this

      createNewUser(username, password, function(response) {
        if (response.usernameLengthError) {
          self.setState({
            loading: false,
            createAccountUsernameExistsError: false,
            createAccountUsernameLengthError: true,
            createAccountPasswordLengthError: false,
            createAccountSubmitError: false
          })
        } else if (response.passwordLengthError) {
          self.setState({
            loading: false,
            createAccountUsernameExistsError: false,
            createAccountUsernameLengthError: false,
            createAccountPasswordLengthError: true,
            createAccountSubmitError: false
          })
        } else if (response.alreadyExistsError) {
          self.setState({
            loading: false,
            createAccountUsernameExistsError: true,
            createAccountUsernameLengthError: false,
            createAccountPasswordLengthError: false,
            createAccountSubmitError: false
          })
        } else if (response.submitError || !response.success) {
          self.setState({
            loading: false,
            createAccountUsernameExistsError: false,
            createAccountUsernameLengthError: false,
            createAccountPasswordLengthError: false,
            createAccountSubmitError: true
          })
        } else {
          window.location.href = `/${self.props.goto}`
        }
      })
    }
  }

  render() {
    return (
      <section className="sign-up-section">
        <HeadMetadata
          title="Sign up | Hacker News"
        />
        <GoogleAnalytics />
        <div className="sign-up-wrapper">
          <div className="sign-up-title">
            <h1>Create Account</h1>
          </div>
          { this.state.createAccountUsernameExistsError ? <div className="sign-up-error-msg">That username is taken.</div> : null }
          { this.state.createAccountUsernameLengthError ? <div className="sign-up-error-msg">Username must be between 2 and 15 characters long.</div> : null }
          { this.state.createAccountPasswordLengthError ? <div className="sign-up-error-msg">Passwords should be at least 8 characters.</div> : null }
          { this.state.createAccountSubmitError ? <div className="sign-up-error-msg">An error occurred.</div> : null }
          <div className="sign-up-form-row">
            <div className="sign-up-form-icon">
              <div className="sign-up-form-icon-inner">
                <svg viewBox="0 0 448 512">
                  <path fill="#495057" d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path>
                </svg>
              </div>
            </div>
            <div className="sign-up-form-input">
              <input
                type="text"
                value={this.state.createAccountUsernameInputValue}
                onChange={this.updateCreateAccountUsernameInputValue}
                placeholder="Username"
              />
            </div>
          </div>
          <div className="sign-up-form-row">
            <div className="sign-up-form-icon">
              <div className="sign-up-form-icon-inner">
                <svg viewBox="0 0 512 512">
                  <path fill="#495057" d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path>
                </svg>
              </div>
            </div>
            <div className="sign-up-form-input">
              <input
                type="password"
                value={this.state.createAcountPasswordInputValue}
                onChange={this.updateCreateAccountPasswordInputValue}
                placeholder="Password"
              />
            </div>
          </div>
          <div className="sign-up-form-submit">
            <input
              type="submit"
              value="Create Account"
              onClick={() => this.submitCreateAccount()}
            />
          </div>
        </div>
      </section>
    )
  }
}
