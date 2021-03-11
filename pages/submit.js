import { Component } from "react"

import "../styles/pages/submit.css"

import HeadMetadata from "../components/headMetadata.js"
import AlternateHeader from "../components/alternateHeader.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import authUser from "../api/users/authUser.js"
import submitNewItem from "../api/items/submitNewItem.js"

export default class extends Component {
  static async getInitialProps ({req, res, query}) {
    const authResult = await authUser(req)

    if (!authResult.success) {
      res.writeHead(302, {
        Location: "/login?goto=submit"
      })

      res.end()
    }

    return {}
  }

  constructor(props) {
    super(props)
    this.state = {
      titleInputValue: "",
      urlInputValue: "",
      textInputValue: "",
      titleRequiredError: false,
      titleTooLongError: false,
      invalidUrlError: false,
      urlAndTextError: false,
      textTooLongError: false,
      submitError: false,
      loading: false
    }
  }

  updateTitleInputValue = (event) => {
    this.setState({titleInputValue: event.target.value})
  }

  updateUrlInputValue = (event) => {
    this.setState({urlInputValue: event.target.value})
  }

  updateTextInputValue = (event) => {
    this.setState({textInputValue: event.target.value})
  }

  submitRequest = () => {
    if (this.state.loading) return

    if (!this.state.titleInputValue.trim()) {
      this.setState({
        titleRequiredError: true,
        titleTooLongError: false,
        invalidUrlError: false,
        urlAndTextError: false,
        textTooLongError: false,
        submitError: false
      })
    } else if (this.state.titleInputValue.length > 80) {
      this.setState({
        titleRequiredError: false,
        titleTooLongError: true,
        invalidUrlError: false,
        urlAndTextError: false,
        textTooLongError: false,
        submitError: false
      })
    } else if (this.state.urlInputValue && this.state.textInputValue) {
      this.setState({
        titleRequiredError: false,
        titleTooLongError: false,
        invalidUrlError: false,
        urlAndTextError: true,
        textTooLongError: false,
        submitError: false
      })
    } else if (this.state.textInputValue.length > 5000) {
      this.setState({
        titleRequiredError: false,
        titleTooLongError: false,
        invalidUrlError: false,
        urlAndTextError: false,
        textTooLongError: true,
        submitError: false
      })
    } else {
      this.setState({loading: true})

      const self = this

      submitNewItem(this.state.titleInputValue, this.state.urlInputValue, this.state.textInputValue, function(response) {
        if (response.authError) {
          window.location.href = "/login?goto=submit"
        } else if (response.titleRequiredError) {
          self.setState({
            loading: false,
            titleRequiredError: true,
            titleTooLongError: false,
            invalidUrlError: false,
            urlAndTextError: false,
            textTooLongError: false,
            submitError: false
          })
        } else if (response.urlAndTextError) {
          self.setState({
            loading: false,
            titleRequiredError: false,
            titleTooLongError: false,
            invalidUrlError: false,
            urlAndTextError: true,
            textTooLongError: false,
            submitError: false
          })
        } else if (response.invalidUrlError) {
          self.setState({
            loading: false,
            titleRequiredError: false,
            titleTooLongError: false,
            invalidUrlError: true,
            urlAndTextError: false,
            textTooLongError: false,
            submitError: false
          })
        } else if (response.titleTooLongError) {
          self.setState({
            loading: false,
            titleRequiredError: false,
            titleTooLongError: true,
            invalidUrlError: false,
            urlAndTextError: false,
            textTooLongError: false,
            submitError: false
          })
        } else if (response.textTooLongError) {
          self.setState({
            loading: false,
            titleRequiredError: false,
            titleTooLongError: false,
            invalidUrlError: false,
            urlAndTextError: false,
            textTooLongError: true,
            submitError: false
          })
        } else if (response.submitError || !response.success) {
          self.setState({
            loading: false,
            titleRequiredError: false,
            titleTooLongError: false,
            invalidUrlError: false,
            urlAndTextError: false,
            textTooLongError: false,
            submitError: true
          })
        } else {
          window.location.href = "/newest"
        }
      })
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Submit | Hacker News"
        />
        <GoogleAnalytics />
        <AlternateHeader
          displayMessage="Submit"
        />
        <div className="submit-content-container">
          {
            this.state.titleRequiredError ?
            <div className="submit-content-error-msg">
              <span>Title is required.</span>
            </div> : null
          }
          {
            this.state.titleTooLongError ?
            <div className="submit-content-error-msg">
              <span>Title exceeds limit of 80 characters.</span>
            </div> : null
          }
          {
            this.state.invalidUrlError ?
            <div className="submit-content-error-msg">
              <span>URL is invalid.</span>
            </div> : null
          }
          {
            this.state.urlAndTextError ?
            <div className="submit-content-error-msg">
              <span>Submissions can’t have both urls and text, so you need to pick one. If you keep the url, you can always post your text as a comment in the thread.</span>
            </div> : null
          }
          {
            this.state.textTooLongError ?
            <div className="submit-content-error-msg">
              <span>Text exceeds limit of 5,000 characters.</span>
            </div> : null
          }
          {
            this.state.submitError ?
            <div className="submit-content-error-msg">
              <span>An error occurred.</span>
            </div> : null
          }
          <div className="submit-content-input-item title">
            <div className="submit-content-input-item-label">
              <span>title</span>
            </div>
            <div className="submit-content-input-item-input">
              <input
                type="text"
                value={this.state.titleInputValue}
                onChange={this.updateTitleInputValue}
              />
            </div>
          </div>
          <div className="submit-content-input-item url">
            <div className="submit-content-input-item-label">
              <span>url</span>
            </div>
            <div className="submit-content-input-item-input">
              <input
                type="text"
                value={this.state.urlInputValue}
                onChange={this.updateUrlInputValue}
              />
            </div>
          </div>
          <div className="submit-content-input-or-divider">
            <span>or</span>
          </div>
          <div className="submit-content-text-input-item">
            <div className="submit-content-text-input-item-label">
              <span>text</span>
            </div>
            <div className="submit-content-text-input-item-input">
              <textarea
                type="text"
                value={this.state.textInputValue}
                onChange={this.updateTextInputValue}
              />
            </div>
          </div>
          <div className="submit-content-input-btn">
            <input
              type="submit"
              value="submit"
              onClick={() => this.submitRequest()}
            />
          </div>
          <div className="submit-content-bottom-instructions">
            <span>Leave url blank to submit a question for discussion. If there is no url, the text (if any) will appear at the top of the thread.</span>
          </div>
        </div>
      </div>
    )
  }
}
